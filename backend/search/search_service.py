from elasticsearch_dsl import Q
from catalog.documents import ProductDocument

class SearchService:
    @staticmethod
    def search_products(query, filters=None):
        """
        Advanced product search with filters
        """
        search = ProductDocument.search()
        
        if query:
            # Multi-field search with boosting
            q = Q("multi_match", 
                  query=query, 
                  fields=['name^3', 'description', 'sku^2', 'category_name'],
                  fuzziness='AUTO')
            search = search.query(q)
        
        # Apply filters
        if filters:
            if filters.get('category'):
                search = search.filter('term', category_name=filters['category'])
            
            if filters.get('min_price'):
                search = search.filter('range', price={'gte': filters['min_price']})
            
            if filters.get('max_price'):
                search = search.filter('range', price={'lte': filters['max_price']})
            
            if filters.get('in_stock'):
                search = search.filter('range', stock_quantity={'gt': 0})
        
        # Only active products
        search = search.filter('term', is_active=True)
        
        return search
    
    @staticmethod
    def autocomplete(query, limit=10):
        """
        Autocomplete suggestions
        """
        search = ProductDocument.search()
        search = search.query("match_phrase_prefix", name=query)
        search = search.filter('term', is_active=True)
        search = search[:limit]
        
        return [hit.name for hit in search.execute()]
