# NutriConnect - Smart School Meals & Subsidy Platform

**ReviveNation Hackathon 2025 Submission**

NutriConnect revolutionizes school meal management in Sri Lanka by integrating SLUDI, NDX, and PayDPI to provide seamless nutrition support for students, parents, and schools.

## 🎯 Problem Solved

School children miss subsidized meals and nutrition guidance due to manual processes and limited visibility into available programs. NutriConnect provides a digital platform for meal ordering, subsidy distribution, and nutrition tracking.

## 🏗️ Architecture

- **Frontend**: React web application with responsive design
- **Backend**: Node.js REST API with Express framework
- **Mock DPI**: Simulated SLUDI, NDX, and PayDPI services
- **Database**: SQLite for development, PostgreSQL-ready for production

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Docker (optional)

### Setup & Run
```bash
# Clone and setup
git clone <repository-url>
cd nutriconnect-hackathon
chmod +x setup.sh
./setup.sh

# Start development servers
npm run dev        # Starts both frontend and backend
# OR
npm run dev:backend  # Backend only (http://localhost:3001)
npm run dev:frontend # Frontend only (http://localhost:3000)
```

### Using Docker
```bash
docker-compose up -d
```

## 🔧 API Documentation

After starting the backend, visit:
- **Swagger UI**: http://localhost:3001/api-docs
- **API Base**: http://localhost:3001/api/v1

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login via Mock SLUDI
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

#### Meals & Nutrition  
- `GET /api/menus/today` - Get today's school menu
- `POST /api/orders` - Place meal order
- `GET /api/nutrition/{studentId}` - Get nutrition analytics

#### Payments
- `POST /api/payments/process` - Process meal payment with subsidies
- `GET /api/payments/history` - Payment transaction history

#### Downstream APIs (For Other Teams)
- `GET /api/v1/schools/{id}/feedback` - School meal feedback data
- `GET /api/v1/nutrition/analytics` - Aggregated nutrition analytics
- `POST /api/v1/feedback/submit` - Submit external feedback

## 👥 Demo Users

### Student Login
- **Username**: `student123`
- **Password**: `password123`
- **School**: Royal College, Grade 10A

### Parent Login  
- **Username**: `parent456`
- **Password**: `password456`
- **Children**: Linked to student123

### School Staff Login
- **Username**: `staff789`
- **Password**: `password789`
- **Role**: Canteen Manager

## 🧪 Testing

```bash
# Run backend tests
npm run test:backend

# Run frontend tests  
npm run test:frontend

# Run integration tests
npm run test:e2e
```

## 📱 Demo Flow

1. **Login** as student123/password123
2. **Browse** today's menu with nutrition scores
3. **Order** meals (subsidies auto-applied)
4. **View** nutrition dashboard and meal history
5. **Provide** feedback on consumed meals

## 🏆 Hackathon Deliverables

- ✅ **Problem Statement** ([docs/problem.md](docs/problem.md))
- ✅ **Solution Overview** ([docs/solution.md](docs/solution.md))  
- ✅ **Working POC** (Complete SLUDI → NDX → PayDPI flow)
- ✅ **OpenAPI Documentation** (http://localhost:3001/api-docs)
- ✅ **Downstream APIs** (For other teams to integrate)

## 🔗 DPI Integration Points

### SLUDI (Mock)
- OAuth2/OIDC authentication flow
- Student, parent, and staff identity verification
- Role-based permission management

### NDX (Mock)
- School canteen menu data exchange
- Student health and dietary restriction records
- Government subsidy program information

### PayDPI (Mock)  
- Automated subsidy distribution
- Parent payment processing
- Transaction reporting and reconciliation

## 👨‍💻 Team Information

- **Team Name**: NutriConnect Innovators
- **Repository**: [GitHub Link]
- **Demo Video**: [YouTube Link]
- **Live Demo**: [Deployment Link]

## 📞 Support

For technical issues or questions:
- Create an issue in this repository
- Contact team members via Discord: [Team Channel]
- Email: team@nutriconnect.lk

---

**Built with ❤️ for ReviveNation Hackathon 2025**
