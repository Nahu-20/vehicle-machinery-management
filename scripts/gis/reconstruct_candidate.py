import json
import hashlib
import os
import shutil

SRC_PATH = "gis/source/eth_admin2_cod_ab_v04.geojson"
PROCESSED_PATH = "gis/processed/oromia-zones-candidate.geojson"
RUNTIME_PATH = "public/data/gis/oromia-zones-candidate.geojson"
EXPECTED_HASH = "1bf5f493b60ac3b2bb6ac513003794a69fd41762e6b8983d72c954a499c65b2f"

CANONICAL_DEFS = {
    "ET0401": {"zone_id": "west_wellega", "prototype_id": "w-wellega", "name_en": "West Wellega", "name_om": "Wallagga Lixaa", "name_am": "ምዕራብ ወለጋ"},
    "ET0402": {"zone_id": "east_wellega", "prototype_id": "e-wellega", "name_en": "East Wellega", "name_om": "Wallagga Bahaa", "name_am": "ምስራቅ ወለጋ"},
    "ET0403": {"zone_id": "ilu_aba_bora", "prototype_id": "ilu-aba-bora", "name_en": "Ilu Aba Bora", "name_om": "Illu Abbaa Boor", "name_am": "ኢሉ አባ ቦራ"},
    "ET0404": {"zone_id": "jimma", "prototype_id": "jimma", "name_en": "Jimma", "name_om": "Jimmaa", "name_am": "ጅማ"},
    "ET0405": {"zone_id": "west_shewa", "prototype_id": "w-shewa", "name_en": "West Shewa", "name_om": "Shawaa Lixaa", "name_am": "ምዕራብ ሸዋ"},
    "ET0406": {"zone_id": "north_shewa", "prototype_id": "n-shewa", "name_en": "North Shewa (OR)", "name_om": "Shawaa Kaabaa", "name_am": "ሰሜን ሸዋ"},
    "ET0407": {"zone_id": "east_shewa", "prototype_id": "e-shewa", "name_en": "East Shewa", "name_om": "Shawaa Bahaa", "name_am": "ምስራቅ ሸዋ"},
    "ET0408": {"zone_id": "arsi", "prototype_id": "arsi", "name_en": "Arsi", "name_om": "Arsii", "name_am": "አርሲ"},
    "ET0409": {"zone_id": "west_hararghe", "prototype_id": "w-hararge", "name_en": "West Hararghe", "name_om": "Hararghe Lixaa", "name_am": "ምዕራብ ሐረርጌ"},
    "ET0410": {"zone_id": "east_hararghe", "prototype_id": "e-hararge", "name_en": "East Hararghe", "name_om": "Hararghe Bahaa", "name_am": "ምስራቅ ሐረርጌ"},
    "ET0411": {"zone_id": "bale", "prototype_id": "bale", "name_en": "Bale", "name_om": "Baale", "name_am": "ባሌ"},
    "ET0412": {"zone_id": "borena", "prototype_id": "borena", "name_en": "Borena", "name_om": "Boorana", "name_am": "ቦረና"},
    "ET0413": {"zone_id": "south_west_shewa", "prototype_id": "sw-shewa", "name_en": "South West Shewa", "name_om": "Shawaa Kibba Lixaa", "name_am": "ደቡብ ምዕራብ ሸዋ"},
    "ET0414": {"zone_id": "guji", "prototype_id": "guji", "name_en": "Guji", "name_om": "Guujii", "name_am": "ጉጂ"},
    "ET0415": {"zone_id": "west_guji", "prototype_id": "w-guji", "name_en": "West Guji", "name_om": "Guujii Lixaa", "name_am": "ምዕራብ ጉጂ"},
    "ET0416": {"zone_id": "buno_bedele", "prototype_id": "buno-bedele", "name_en": "Buno Bedele", "name_om": "Buunnoo Eebbaa Dallee", "name_am": "ቡኖ በደሌ"},
    "ET0417": {"zone_id": "west_arsi", "prototype_id": "w-arsi", "name_en": "West Arsi", "name_om": "Arsii Lixaa", "name_am": "ምዕራብ አርሲ"},
    "ET0418": {"zone_id": "kelem_wellega", "prototype_id": "kellem-wellega", "name_en": "Kelem Wellega", "name_om": "Qellem Wallaggaa", "name_am": "ቄለም ወለጋ"},
    "ET0419": {"zone_id": "horo_gudru_wellega", "prototype_id": "horo-gudru", "name_en": "Horo Gudru Wellega", "name_om": "Hoorroo Guduruu Wallaggaa", "name_am": "ሆሮ ጉዱሩ ወለጋ"},
    "ET0420": {"zone_id": "shager_city", "prototype_id": "finfinne-special", "name_en": "Shager City", "name_om": "Magaalaa Shaggar", "name_am": "ሸገር ከተማ"},
    "ET0421": {"zone_id": "east_bale", "prototype_id": "e-bale", "name_en": "East Bale", "name_om": "Baale Bahaa", "name_am": "ምስራቅ ባሌ"},
    "ET0422": {"zone_id": "east_borena", "prototype_id": None, "name_en": "East Borena", "name_om": "Boorana Bahaa", "name_am": "ምስራቅ ቦረና"}
}

def reconstruct():
    print("Reading authentic source ADM2 GeoJSON...")
    with open(SRC_PATH, "r", encoding="utf-8") as f:
        src_data = json.load(f)

    oromia_feats = [f for f in src_data["features"] if f["properties"].get("adm1_pcode") == "ET04"]
    assert len(oromia_feats) == 22, f"Expected 22 source features for ET04, got {len(oromia_feats)}"

    oromia_feats.sort(key=lambda x: x["properties"]["adm2_pcode"])

    out_features = []
    for f in oromia_feats:
        pcode = f["properties"]["adm2_pcode"]
        cdef = CANONICAL_DEFS[pcode]
        props = {
            "zone_id": cdef["zone_id"],
            "prototype_id": cdef["prototype_id"],
            "pcode": pcode,
            "name_en": cdef["name_en"],
            "name_om": cdef["name_om"],
            "name_am": cdef["name_am"],
            "name_om_verification": "pending_bureau_signoff",
            "name_am_verification": "pending_bureau_signoff",
            "source_dataset_id": "cod-ab-eth-v04",
            "source_organization": "UN-OCHA FIS / Ethiopia CSA + BoFED",
            "admin_level": "zone",
            "area_sqkm": f["properties"]["area_sqkm"],
            "valid_on": f["properties"]["valid_on"]
        }
        feat = {
            "type": "Feature",
            "id": cdef["zone_id"],
            "properties": props,
            "geometry": f["geometry"]
        }
        out_features.append(feat)

    out_collection = {
        "type": "FeatureCollection",
        "name": "Oromia Administrative Boundaries (UN-OCHA COD-AB v04)",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": out_features
    }

    # Format JSON
    json_bytes = json.dumps(out_collection, ensure_ascii=False, indent=2).encode("utf-8")
    calc_hash = hashlib.sha256(json_bytes).hexdigest()

    print(f"Reconstructed Candidate Byte Size: {len(json_bytes)}")
    print(f"Reconstructed Candidate SHA-256:   {calc_hash}")
    print(f"Expected Historical SHA-256:       {EXPECTED_HASH}")

    with open(PROCESSED_PATH, "wb") as f:
        f.write(json_bytes)
    print(f"Wrote {PROCESSED_PATH}")

    shutil.copyfile(PROCESSED_PATH, RUNTIME_PATH)
    print(f"Copied to {RUNTIME_PATH}")

    proc_size = os.path.getsize(PROCESSED_PATH)
    run_size = os.path.getsize(RUNTIME_PATH)
    assert proc_size == run_size == len(json_bytes)
    print("Filesystem size verification: PASS")

if __name__ == "__main__":
    reconstruct()
