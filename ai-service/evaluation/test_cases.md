# AgriConnect AI Service Test Cases

Here are 5 test cases for demo farmer profiles to validate the AI recommendation service.

## 1. Ravi (Karnataka) - Tomato Focus
- **Location**: 12.97, 77.59
- **Season**: kharif
- **Soil**: loamy
- **Irrigation**: drip
- **Land Size**: 2.5 hectares
- **Expected Top Crop**: Tomato

```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"latitude": 12.97, "longitude": 77.59, "district": "Bangalore"},
    "farm_details": {"soil_type": "loamy", "land_size_ha": 2.5, "irrigation_type": "drip"},
    "season": "kharif"
  }'
```

## 2. Priya (Punjab) - Wheat Focus
- **Location**: 30.73, 76.78
- **Season**: rabi
- **Soil**: alluvial
- **Irrigation**: canal
- **Land Size**: 5.0 hectares
- **Expected Top Crop**: Wheat

```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"latitude": 30.73, "longitude": 76.78, "district": "Chandigarh"},
    "farm_details": {"soil_type": "alluvial", "land_size_ha": 5.0, "irrigation_type": "canal"},
    "season": "rabi"
  }'
```

## 3. Arjun (Maharashtra) - Cotton Focus
- **Location**: 19.07, 72.87
- **Season**: kharif
- **Soil**: black
- **Irrigation**: rainfed
- **Land Size**: 3.0 hectares
- **Expected Top Crop**: Cotton

```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"latitude": 19.07, "longitude": 72.87, "district": "Mumbai"},
    "farm_details": {"soil_type": "black", "land_size_ha": 3.0, "irrigation_type": "rainfed"},
    "season": "kharif"
  }'
```

## 4. Lakshmi (Tamil Nadu) - Banana Focus
- **Location**: 11.01, 76.97
- **Season**: zaid
- **Soil**: red
- **Irrigation**: sprinkler
- **Land Size**: 1.5 hectares
- **Expected Top Crop**: Banana

```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"latitude": 11.01, "longitude": 76.97, "district": "Coimbatore"},
    "farm_details": {"soil_type": "red", "land_size_ha": 1.5, "irrigation_type": "sprinkler"},
    "season": "zaid"
  }'
```

## 5. Suresh (MP) - Soybean Focus
- **Location**: 23.25, 77.41
- **Season**: kharif
- **Soil**: clay
- **Irrigation**: flood
- **Land Size**: 4.0 hectares
- **Expected Top Crop**: Soybean

```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"latitude": 23.25, "longitude": 77.41, "district": "Bhopal"},
    "farm_details": {"soil_type": "clay", "land_size_ha": 4.0, "irrigation_type": "flood"},
    "season": "kharif"
  }'
```
