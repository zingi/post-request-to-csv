# Post Request to CSV
_Server which converts post requests to csv entries._

## Settings via Env Variables

* `AUTH_TOKEN`=[random String]
* `T_[table-name]`=col1,col2,col3
* `IGNORE_EMPTY`=['true' || 'false'] (default: true)

## API

| Endpoint | Description |
|----------|-------------|
|GET `/t`|get available tables|
|GET `/t/:table`|get csv file for table|
|POST `/t:table`|add entry/entries to table|
|DELETE `/t:table`|delete csv file by table|

* **Note** If an auth token is set, you have to provide it in the header with: **auth: [token]**.

* Example to add a csv entry: 
    ```bash
    curl -H "Content-Type: application/json" -X POST \
    -d '[{"col1":"abc","col2":"xyz"}, {"col1":"123", "col2": "456"}]' \
    localhost:3000/t/table1
    ```

* Example to download a csv file:
    ```bash
    curl -O localhost:3000/table1
    ```

## Example docker-compose.yml

```yaml
version: '3.7'
services: 
  pr2csv:
    container_name: pr2csv
    image: zingi/pr2csv:1.0.0
    volumes: 
      - pr2csv-data:/data
    ports: 
      - 3000:3000
    environment: 
      T_TABLE1: 'col1,col2,col3'
      T_TABLE2: 'col1,col2,col3'

volumes: 
  pr2csv-data:
```