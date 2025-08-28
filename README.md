# ParkWise - AI & Real-Time Parking Assistant 🚗

ParkWise is a full-stack, serverless web application designed to solve the urban challenge of finding parking in Pune, India. It offers a dual-mode interface, providing users with both live, real-time parking availability based on crowd-sourced reports and an AI-powered predictive forecast for future parking conditions.
<img width="1918" height="785" alt="image" src="https://github.com/user-attachments/assets/dfc94473-a43f-4fc2-8eca-ff3249a439be" />

<img width="1899" height="769" alt="image" src="https://github.com/user-attachments/assets/4f0c9d96-2035-4ac4-801d-789ca3517511" />
<img width="1896" height="776" alt="image" src="https://github.com/user-attachments/assets/838634c5-184d-42f4-a1c6-f1ed046bf90c" />

## 🌟 Key Features

- **Live Parking View**: See the current availability of parking spots (e.g., 25/40 Available) updated instantly for all users
- **AI Predictive Forecast**: View a 24-hour availability forecast, powered by a machine learning model that analyzes historical data
- **Interactive Map Interface**: A mobile-first map built with Leaflet, showing color-coded parking zones (Green for Available, Yellow for Limited, Red for Full)
- **Real-Time Reporting**: Users can report parking actions ("I Just Parked," "I Just Left," "Area is Full") with a single tap, which immediately updates the map for everyone
- **User Geolocation**: The app automatically detects the user's location to find the nearest parking zones and enable reporting
- **Dual Mode UI**: Seamlessly switch between the "Live" and "Forecast" views to get the information you need
- **Progressive Web App (PWA)**: Installable on any mobile device directly from the browser for a native-app-like experience

## 🏗️ System Architecture

The application is built on a robust, scalable, and cost-effective serverless architecture, adhering to a free-tier-only constraint.

### Real-Time Update Flow

1. A user submits a report (e.g., "I Just Parked") from the Next.js frontend
2. The report is sent to an AWS Lambda function via API Gateway
3. The Lambda function atomically updates the `currentOccupancy` count in the MongoDB Atlas database
4. After the database update, the Lambda function publishes a "zone-update" event to Pusher
5. Pusher instantly broadcasts this event to all connected clients via WebSockets
6. The Next.js Frontend receives the event and updates its UI state, re-rendering the map with the new availability count

### AI Training Flow (Nightly)

1. A scheduled GitHub Action workflow runs once every night
2. The workflow executes a Python script
3. The script connects to MongoDB Atlas and fetches all user reports from the past
4. It performs feature engineering and trains a Scikit-learn time-series model
5. The model generates a 24-hour forecast (at 15-minute intervals) for each parking zone
6. The script stores this forecast in the `predictions` array of the corresponding zone document in MongoDB

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js (React), Leaflet, Tailwind CSS, shadcn/ui, Recharts, Pusher.js |
| Backend | Node.js, Express.js, Serverless Framework |
| Database & Cache | MongoDB Atlas (M0 Cluster), Upstash Redis |
| AI & Automation | Python, Pandas, Scikit-learn, GitHub Actions |
| Real-Time Service | Pusher |
| Deployment | Vercel (Frontend), AWS Lambda & API Gateway (Backend) |

## 🚀 Getting Started & Local Setup

Follow these steps to set up and run the project on your local machine.

### Prerequisites

- Node.js (v18 or later)
- Python (v3.9 or later) & pip
- MongoDB Database Tools (for mongoimport)
- An AWS Account with credentials configured for the Serverless Framework
- Global installation of the Serverless Framework: `npm install -g serverless`

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/parkwise-project.git
cd parkwise-project
```

### 2. Backend Setup (parkwise-backend)

```bash
cd parkwise-backend
npm install

# Create a .env file from the example
cp .env.example .env
```

Now, fill in the required environment variables in `.env` (see the Environment Variables section below). After that, you can run the backend locally:

```bash
# Start the local serverless development server
npx serverless offline start
```

Your backend API will be running at `http://localhost:4000`.

### 3. Frontend Setup (parkwise-frontend)

```bash
cd ../parkwise-frontend
npm install

# Create a .env.local file from the example
cp .env.local.example .env.local
```

Fill in your `NEXT_PUBLIC` environment variables in `.env.local`:

```bash
# Start the frontend development server
npm run dev
```

Your frontend will be accessible at `http://localhost:3000`.

### 4. AI Script Setup (scripts)

```bash
cd ../scripts
pip install -r requirements.txt

# Create a .env file
cp .env.example .env
```

Fill in your `MONGO_URI` in the `.env` file for the script:

```bash
# Run the training script manually
python train_model.py
```

## 🔑 Environment Variables

You must create `.env` files for each service. Obtain the keys from the respective service websites.

### parkwise-backend/.env

```ini
# Get from MongoDB Atlas
MONGO_URI="mongodb+srv://..."

# Get from Upstash
REDIS_URI="redis://..."

# Get from Pusher.com App Keys
PUSHER_APP_ID="123456"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="ap2"
```

### parkwise-frontend/.env.local

```ini
# The URL of your locally running backend
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Get from Pusher.com App Keys (use the public key)
NEXT_PUBLIC_PUSHER_KEY="your_public_pusher_key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"
```

### scripts/.env

```ini
# Get from MongoDB Atlas
MONGO_URI="mongodb+srv://..."
```



## 🚀 Deployment

### Frontend Deployment (Vercel)

1. Push your code to a GitHub repository
2. Connect your GitHub repo to Vercel
3. Set the environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Backend Deployment (AWS Lambda)

```bash
cd parkwise-backend
# Deploy to AWS
npx serverless deploy --stage production
```

### AI Training Automation (GitHub Actions)

Create `.github/workflows/train-model.yml`:

```yaml
name: Train Parking Model
on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd scripts
          pip install -r requirements.txt
      - name: Train model
        env:
          MONGO_URI: ${{ secrets.MONGO_URI }}
        run: |
          cd scripts
          python train_model.py
```

## 🧪 Testing

### Run Frontend Tests

```bash
cd parkwise-frontend
npm run test
```

### Run Backend Tests

```bash
cd parkwise-backend
npm run test
```

## 📊 API Documentation

### Endpoints

- `GET /zones` - Get all parking zones
- `POST /zones/:id/report` - Report parking action
- `GET /zones/:id/forecast` - Get AI forecast for a zone

### Example API Usage

```javascript
// Report parking action
const response = await fetch('/api/zones/zone-1/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'PARKED',
    userId: 'user-123'
  })
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- OpenStreetMap for map data
- MongoDB Atlas for database hosting
- Vercel for frontend hosting
- AWS for serverless backend infrastructure
- Pusher for real-time communication

## 📞 Support

If you encounter any issues or have questions, please file an issue on GitHub or contact [textmevaibhav@gmail.com].

---


Made with ❤️ for solving urban parking challenges in Pune, India.
