from serpapi import GoogleSearch

params = {
  "engine": "google_maps",
  "q": "Coffee",
  "ll": "@40.7455096,-74.0083012,14z",
  "api_key": ""
}

search = GoogleSearch(params)
results = search.get_dict()
local_results = results["local_results"]

print(local_results)