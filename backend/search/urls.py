from django.urls import path
from .views import AdvancedSearchView, AutocompleteView

urlpatterns = [
    path('advanced/', AdvancedSearchView.as_view(), name='advanced-search'),
    path('autocomplete/', AutocompleteView.as_view(), name='autocomplete'),
]
