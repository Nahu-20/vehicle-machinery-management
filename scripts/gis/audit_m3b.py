import json
import hashlib
import shapely.geometry
from shapely.geos import geos_version_string
import shapely.validation
import pyproj

RAW_PATH = 'public/data/gis/oromia-zones-candidate.geojson'

def run_m3b_audit():
    with open(RAW_PATH, 'rb') as f:
        data_bytes = f.read()
    
    sha256 = hashlib.sha256(data_bytes).hexdigest()
    print(f"Checksum: {sha256}")

    geojson = json.loads(data_bytes.decode('utf-8'))
    features = geojson['features']

    geod = pyproj.Geod(ellps="WGS84")

    feature_reports = []

    tot_tuples = 0
    tot_vertices = 0
    tot_polygons = 0
    tot_multipolygons = 0
    tot_polygon_members = 0
    tot_exterior_rings = 0
    tot_interior_rings = 0
    tot_rings = 0

    shapely_shapes = {}

    for idx, f in enumerate(features):
        p = f['properties']
        g = f['geometry']
        pcode = p['pcode']
        zone_id = p['zone_id']
        gtype = g['type']

        shape = shapely.geometry.shape(g)
        shapely_shapes[zone_id] = shape

        # Geometry validity
        is_valid = shape.is_valid
        validity_reason = shapely.validation.explain_validity(shape) if not is_valid else "Valid"

        # Ring and tuple counting
        part_count = 0
        ring_count = 0
        tuples_inc = 0
        verts_exc = 0

        if gtype == 'Polygon':
            tot_polygons += 1
            part_count = 1
            tot_polygon_members += 1
            rings = g['coordinates']
            ring_count = len(rings)
            tot_exterior_rings += 1
            tot_interior_rings += (ring_count - 1)
            tot_rings += ring_count

            for r_idx, ring in enumerate(rings):
                n = len(ring)
                tuples_inc += n
                verts_exc += (n - 1)

        elif gtype == 'MultiPolygon':
            tot_multipolygons += 1
            polys = g['coordinates']
            part_count = len(polys)
            tot_polygon_members += part_count
            tot_exterior_rings += part_count

            for poly in polys:
                p_rings = len(poly)
                ring_count += p_rings
                tot_interior_rings += (p_rings - 1)
                tot_rings += p_rings
                for ring in poly:
                    n = len(ring)
                    tuples_inc += n
                    verts_exc += (n - 1)

        tot_tuples += tuples_inc
        tot_vertices += verts_exc

        # Area calculation using pyproj.Geod
        area_m2, _ = geod.geometry_area_perimeter(shape)
        area_km2 = round(abs(area_m2) / 1e6, 2)

        feature_reports.append({
            'pcode': pcode,
            'zone_id': zone_id,
            'gtype': gtype,
            'part_count': part_count,
            'ring_count': ring_count,
            'tuples_inc': tuples_inc,
            'verts_exc': verts_exc,
            'is_valid': is_valid,
            'validity_reason': validity_reason,
            'area_km2': area_km2
        })

    print("\n--- FEATURE INVENTORY ---")
    for r in feature_reports:
        print(f"{r['pcode']} | {r['zone_id']:20s} | {r['gtype']:12s} | Parts: {r['part_count']} | Rings: {r['ring_count']} | Tuples: {r['tuples_inc']} | Verts: {r['verts_exc']} | Valid: {r['is_valid']} | Area: {r['area_km2']} km2")

    print("\n--- DATASET TOTALS ---")
    print(f"Total Features: {len(features)}")
    print(f"Polygon Features: {tot_polygons}")
    print(f"MultiPolygon Features: {tot_multipolygons}")
    print(f"Total Polygon Members: {tot_polygon_members}")
    print(f"Exterior Rings: {tot_exterior_rings}")
    print(f"Interior Rings: {tot_interior_rings}")
    print(f"Total Rings: {tot_rings}")
    print(f"Total Coordinate Tuples (including closure): {tot_tuples}")
    print(f"Total Vertices (excluding closure): {tot_vertices}")

    # Adjacency analysis (EDGE_ADJACENT vs POINT_TOUCHING)
    edge_adjacent = {r['zone_id']: [] for r in feature_reports}
    point_touching = {r['zone_id']: [] for r in feature_reports}

    zone_ids = [r['zone_id'] for r in feature_reports]
    for i in range(len(zone_ids)):
        for j in range(i + 1, len(zone_ids)):
            z1, z2 = zone_ids[i], zone_ids[j]
            s1, s2 = shapely_shapes[z1], shapely_shapes[z2]

            if s1.intersects(s2):
                inter = s1.intersection(s2)
                if inter.is_empty:
                    continue
                itype = inter.geom_type
                if itype in ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection']:
                    length = inter.length
                    if length > 1e-7:
                        edge_adjacent[z1].append(z2)
                        edge_adjacent[z2].append(z1)
                    else:
                        point_touching[z1].append(z2)
                        point_touching[z2].append(z1)
                elif itype in ['Point', 'MultiPoint']:
                    point_touching[z1].append(z2)
                    point_touching[z2].append(z1)

    for z in zone_ids:
        edge_adjacent[z].sort()
        point_touching[z].sort()

    print("\n--- ADJACENCY MATRIX ---")
    for z in zone_ids:
        print(f"{z:20s} -> EDGE: {edge_adjacent[z]} | POINT: {point_touching[z]}")

    # Coverage overlap check
    print("\n--- COVERAGE OVERLAP CHECK ---")
    overlaps = []
    for i in range(len(zone_ids)):
        for j in range(i + 1, len(zone_ids)):
            z1, z2 = zone_ids[i], zone_ids[j]
            s1, s2 = shapely_shapes[z1], shapely_shapes[z2]
            if s1.overlaps(s2):
                inter = s1.intersection(s2)
                area_m2, _ = geod.geometry_area_perimeter(inter)
                area_km2 = abs(area_m2) / 1e6
                if area_km2 > 0.0001:
                    overlaps.append((z1, z2, area_km2))

    print(f"Unintended overlaps detected: {len(overlaps)}")
    for o in overlaps:
        print(f"Overlap {o[0]} <-> {o[1]}: {o[2]} km2")

if __name__ == '__main__':
    run_m3b_audit()
