# URL Shortener & Analytics App

A full-stack URL shortening application with built-in click tracking, analytics visualization, and a custom rate limiter.

## 🚀 How to Run

This project uses Docker Compose to run the backend and frontend together.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### Steps
1. **Clone the repository** (or ensure you have the files locally).
2. **Open a terminal** and navigate to the project root folder.
3. **Run the application**:
   ```bash
   docker-compose up --build
   ```
4. **Access the Application**:
   ```bash
   Dashboard: http://localhost:3000
   API Backend: http://localhost:5000
   ```

### 🛠️ Implementation Details
**Rate Limiter Logic (Fixed Window)**
The custom rate limiter is implemented in *backend/app.py* using an in-memory dictionary (*rate_limit_db*) to store request timestamps for each IP address.
1. Request Tracking: When a request hits */shorten*, the IP address is recorded along with the current time.
2. Window Cleaning: Before checking the limit, the backend removes timestamps older than 60 seconds for that specific IP.
3. Limit Check: The system counts the remaining timestamps. If the count is 5 or more, it returns a 429 Too Many Requests error.
4. Retry Calculation: The error JSON includes a *retry_after* value, calculated by finding the time remaining until the oldest recorded request in the window expires.
**Data Storage**
- In-Memory: To fulfill the requirement of avoiding heavy dependencies, data is stored in Python dictionaries (*url_db *and *rate_limit_db*).
- ⚠️ Data Persistence: Data is lost when the container is restarted.

### 📚 API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/shorten` | `POST` | Shortens a long URL. Requires `{"url": "..."}` in body. |
| `/<alias>` | `GET` | Redirects to original URL and logs a click. |
| `/api/analytics`| `GET` | Returns all links and click history for dashboard. |

#### Example POST /shorten
**Request Body:**
```json
{
  "url": "[https://www.google.com](https://www.google.com)"
}
