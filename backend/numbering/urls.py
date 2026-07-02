from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NumPatMastViewSet, NumPatDetailsViewSet, 
    GenerateNumberView, SequenceView, GenerationLogView
)

router = DefaultRouter()
router.register(r'patterns', NumPatMastViewSet, basename='patterns')
router.register(r'details', NumPatDetailsViewSet, basename='details')

urlpatterns = [
    path('', include(router.urls)),
    path('generate/', GenerateNumberView.as_view(), name='generate-number'),
    path('sequences/', SequenceView.as_view(), name='sequences'),
    path('logs/', GenerationLogView.as_view(), name='logs'),
]