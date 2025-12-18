import pandas as pd

# Test reading the CSV file
csv_path = 'sample_bulk_upload.csv'

try:
    df = pd.read_csv(csv_path)
    print(f"✓ Successfully read CSV file")
    print(f"✓ Total rows: {len(df)}")
    print(f"✓ Columns: {list(df.columns)}")
    print(f"\n✓ First 3 rows:")
    print(df.head(3))
    
    # Check for missing SKUs
    missing_skus = df['SKU'].isna().sum()
    print(f"\n✓ Missing SKUs: {missing_skus}")
    
    # Check data types
    print(f"\n✓ Data types:")
    print(df.dtypes)
    
except Exception as e:
    print(f"✗ Error reading CSV: {e}")
