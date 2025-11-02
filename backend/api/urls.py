# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'availability', views.AvailabilitySlotViewSet, basename='availability')
# Note: EmployeeProfile is handled by the UserDetailView, so we don't need a separate route for it yet.

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # --- Auth Endpoints (You already have these) ---
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/user/', views.UserDetailView.as_view(), name='user-detail'),
    path('auth/profile/', views.EmployeeProfileView.as_view(), name='user-profile'),
    
    # --- New ViewSet URLs ---
    # This line includes all the URLs that the router automatically created.
    # It will create:
    #   /api/projects/
    #   /api/projects/<id>/
    #   /api/tasks/
    #   /api/tasks/<id>/
    #   ...and so on
    path('', include(router.urls)),
]