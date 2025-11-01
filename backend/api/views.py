# api/views.py

from django.contrib.auth.models import User # You already added this!
from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .serializers import (
    RegisterSerializer, UserSerializer, ProjectSerializer, 
    TaskSerializer, AvailabilitySlotSerializer, EmployeeProfileSerializer
)
from .models import Project, Task, AvailabilitySlot, EmployeeProfile

# --- Auth Views (You already built these!) ---

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        else:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

# --- NEW VIEWS (Add everything below this line) ---

class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated] # Only logged-in users can see projects

    def get_queryset(self):
        # This is a key step: only show projects that the logged-in user is a member of.
        return self.request.user.projects.all()

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tasks to be viewed or edited.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return tasks that belong to projects the user is a member of.
        return Task.objects.filter(project__members=self.request.user)

class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    """
    API endpoint for creating, viewing, and deleting availability slots.
    """
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show a user their *own* availability slots.
        return AvailabilitySlot.objects.filter(employee=self.request.user)

    def perform_create(self, serializer):
        # When a new slot is created, automatically assign it to the logged-in user.
        serializer.save(employee=self.request.user)