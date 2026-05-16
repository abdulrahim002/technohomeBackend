/**
 * Global Constants & Configuration
 */

// API Base URL (Point to your local server IP or localhost for testing)
// Updated to your local IP: 172.20.10.4 to work on physical devices
export const API_URL = 'http://172.20.10.4:5000/api';
export const SOCKET_URL = 'http://172.20.10.4:5000';
export const UPLOADS_URL = 'http://172.20.10.4:5000/';
export const GOOGLE_MAPS_API_KEY = 'AIzaSyD4lIDZgZy6LB8S8P9O8pANVGTxEgIwuMQ';

export const TIME_SLOTS = [
  { id: '08:00-10:00', label: '08:00 ص - 10:00 ص' },
  { id: '10:00-12:00', label: '10:00 ص - 12:00 م' },
  { id: '12:00-14:00', label: '12:00 م - 02:00 م' },
  { id: '14:00-16:00', label: '02:00 م - 04:00 م' },
  { id: '16:00-18:00', label: '04:00 م - 06:00 م' },
  { id: '18:00-20:00', label: '06:00 م - 08:00 م' },
];
