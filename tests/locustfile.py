from locust import HttpUser, task, between
import random

class EcommerceUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        response = self.client.post("/api/auth/login/", json={
            "email": "test@example.com",
            "password": "testpass123"
        })
        if response.status_code == 200:
            self.token = response.json().get('access')
            self.client.headers.update({'Authorization': f'Bearer {self.token}'})
    
    @task(3)
    def browse_products(self):
        self.client.get("/api/catalog/products/")
    
    @task(2)
    def view_product(self):
        product_id = random.randint(1, 100)
        self.client.get(f"/api/catalog/products/{product_id}/")
    
    @task(1)
    def add_to_cart(self):
        self.client.post("/api/cart/add/", json={
            "product_id": random.randint(1, 50),
            "quantity": 1
        })
    
    @task(1)
    def view_cart(self):
        self.client.get("/api/cart/")
