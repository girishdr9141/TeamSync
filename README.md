# TeamSync

A web application for managing projects, assigning tasks to employees, and scheduling meetings using intelligent algorithms.

## Features

- **User Authentication**: Secure login and registration system
- **Project Management**: Create and manage collaborative projects
- **Task Assignment**: Automated task assignment using weighted scoring algorithm (SoSTA)
- **Meeting Scheduling**: Intelligent meeting scheduling using genetic algorithms
- **Employee Profiles**: Manage employee skills, availability, and profiles
- **Availability Management**: Set and manage employee availability slots
- **Real-time Collaboration**: Team-based project management

## Tech Stack

### Backend
- **Django** - Web framework
- **Django REST Framework** - API development
- **SQLite** - Database
- **Token Authentication** - Secure API access

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **FullCalendar** - Calendar integration
- **Recharts** - Data visualization

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install django djangorestframework django-cors-headers python-dotenv
   ```

5. Create a `.env` file in the backend directory with:
   ```
   SECRET_KEY=your-secret-key-here
   ```

6. Run migrations:
   ```bash
   python manage.py migrate
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Usage

1. **Register/Login**: Create an account or log in with existing credentials
2. **Create Projects**: Start new projects and invite team members
3. **Manage Tasks**: Add tasks with requirements and deadlines
4. **Set Availability**: Configure your availability slots for scheduling
5. **Run Assignments**: Use the algorithm to automatically assign tasks
6. **Schedule Meetings**: Find optimal meeting times for your team

## API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - User login
- `GET /api/user/` - Get current user details

### Projects
- `GET /api/projects/` - List user's projects
- `POST /api/projects/` - Create new project
- `POST /api/projects/{id}/add_member/` - Add member to project
- `POST /api/projects/{id}/remove_member/` - Remove member from project
- `POST /api/projects/{id}/run_assignment/` - Run task assignment algorithm
- `POST /api/projects/{id}/run_scheduler/` - Run meeting scheduler algorithm

### Tasks
- `GET /api/tasks/` - List user's tasks
- `GET /api/tasks/my_tasks/` - Get tasks assigned to current user
- `POST /api/tasks/` - Create new task

### Availability
- `GET /api/availability/` - Get user's availability slots
- `POST /api/availability/` - Create availability slot
- `POST /api/availability/clear_all/` - Clear all availability slots

### Profile
- `GET /api/profile/` - Get user profile
- `PUT /api/profile/` - Update user profile

## Algorithms

### Task Assignment (SoSTA)
Uses weighted scoring to assign tasks based on:
- Employee skills matching task requirements
- Employee availability
- Task priority and deadlines

### Meeting Scheduler
Genetic algorithm that finds optimal meeting times by:
- Considering all team members' availability
- Minimizing conflicts
- Optimizing for preferred time slots

## Development

### Running Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend (configure for production settings)
cd backend
python manage.py collectstatic
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
