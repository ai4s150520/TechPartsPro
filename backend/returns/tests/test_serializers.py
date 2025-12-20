import pytest
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from returns.serializers import ReturnRequestCreateSerializer
from catalog.models import Product
from orders.models import Order, OrderItem


@pytest.mark.django_db
def test_return_allowed_within_3_days_and_with_evidence():
    User = get_user_model()
    customer = User.objects.create_user(email='cust@example.com', password='pass')
    seller = User.objects.create_user(email='seller@example.com', password='pass')

    product = Product.objects.create(
        seller=seller,
        name='Test Product',
        sku='TP-001',
        description='A product',
        price=Decimal('10.00'),
    )

    order = Order.objects.create(
        user=customer,
        total_amount=Decimal('10.00'),
        shipping_address={},
        status='DELIVERED'
    )
    # mark delivered 2 days ago (within 3-day window)
    order.updated_at = timezone.now() - timedelta(days=2)
    order.save()

    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        product_name=product.name,
        quantity=1,
        price=product.price,
    )

    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = customer

    data = {
        'order_id': order.order_id,
        'request_type': 'RETURN',
        'reason': 'DEFECTIVE',
        'description': 'Item arrived broken and not functioning',
        'images': ['http://example.com/evidence.jpg'],
        'items': [{'order_item_id': order_item.id, 'quantity': 1}],
    }

    serializer = ReturnRequestCreateSerializer(data=data, context={'request': request})
    assert serializer.is_valid(), f"Expected serializer to be valid, got errors: {serializer.errors}"


@pytest.mark.django_db
def test_return_rejected_after_3_days():
    User = get_user_model()
    customer = User.objects.create_user(email='late@example.com', password='pass')
    seller = User.objects.create_user(email='seller2@example.com', password='pass')

    product = Product.objects.create(
        seller=seller,
        name='Late Product',
        sku='LP-001',
        description='A product',
        price=Decimal('20.00'),
    )

    order = Order.objects.create(
        user=customer,
        total_amount=Decimal('20.00'),
        shipping_address={},
        status='DELIVERED'
    )
    # mark delivered 4 days ago (outside 3-day window)
    order.updated_at = timezone.now() - timedelta(days=4)
    order.save()

    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        product_name=product.name,
        quantity=1,
        price=product.price,
    )

    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = customer

    data = {
        'order_id': order.order_id,
        'request_type': 'RETURN',
        'reason': 'DEFECTIVE',
        'description': 'Item arrived broken',
        'images': ['http://example.com/img.jpg'],
        'items': [{'order_item_id': order_item.id, 'quantity': 1}],
    }

    serializer = ReturnRequestCreateSerializer(data=data, context={'request': request})
    assert not serializer.is_valid()
    assert 'order_id' in serializer.errors
    assert 'expired' in serializer.errors['order_id'][0].lower()


@pytest.mark.django_db
def test_evidence_required_for_defective_reason():
    User = get_user_model()
    customer = User.objects.create_user(email='eve@example.com', password='pass')
    seller = User.objects.create_user(email='seller3@example.com', password='pass')

    product = Product.objects.create(
        seller=seller,
        name='Evidence Product',
        sku='EP-001',
        description='A product',
        price=Decimal('15.00'),
    )

    order = Order.objects.create(
        user=customer,
        total_amount=Decimal('15.00'),
        shipping_address={},
        status='DELIVERED'
    )
    order.updated_at = timezone.now() - timedelta(days=1)
    order.save()

    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        product_name=product.name,
        quantity=1,
        price=product.price,
    )

    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = customer

    # No images or video provided for defective reason
    data = {
        'order_id': order.order_id,
        'request_type': 'RETURN',
        'reason': 'DEFECTIVE',
        'description': 'Broken on arrival',
        'items': [{'order_item_id': order_item.id, 'quantity': 1}],
    }

    serializer = ReturnRequestCreateSerializer(data=data, context={'request': request})
    assert not serializer.is_valid()
    assert 'images' in serializer.errors


@pytest.mark.django_db
def test_description_minimum_length_enforced():
    User = get_user_model()
    customer = User.objects.create_user(email='short@example.com', password='pass')
    seller = User.objects.create_user(email='seller4@example.com', password='pass')

    product = Product.objects.create(
        seller=seller,
        name='ShortDesc Product',
        sku='SD-001',
        description='A product',
        price=Decimal('5.00'),
    )

    order = Order.objects.create(
        user=customer,
        total_amount=Decimal('5.00'),
        shipping_address={},
        status='DELIVERED'
    )
    order.updated_at = timezone.now() - timedelta(days=1)
    order.save()

    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        product_name=product.name,
        quantity=1,
        price=product.price,
    )

    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = customer

    data = {
        'order_id': order.order_id,
        'request_type': 'RETURN',
        'reason': 'CHANGED_MIND',
        'description': 'too short',
        'items': [{'order_item_id': order_item.id, 'quantity': 1}],
    }

    serializer = ReturnRequestCreateSerializer(data=data, context={'request': request})
    assert not serializer.is_valid()
    assert 'description' in serializer.errors
