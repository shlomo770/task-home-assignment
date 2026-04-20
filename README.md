# FleetPulse – Real-Time Fleet Dashboard

A full-stack assignment implementing a real-time fleet management system using:

- React + Redux Toolkit (Client)
- Node.js (Mock Server)
- REST + SSE + WebSocket

---

## 📁 Project Structure

task-home-assignment/
│
├── client/   # React + Redux frontend  
├── server/   # Temporary mock server (Node.js)  
└── README.md  

---

## 🚀 Overview

This project demonstrates a real-time system that:

- Loads fleet data via REST  
- Receives live telemetry via SSE  
- Handles real-time events via WebSocket  
- Maintains centralized state using Redux  

---

## ⚠️ Important Note

The assignment referenced a provided `mock server (server.js)` that was not included.

- A temporary mock server was implemented to allow continued development  
- Once the official server is provided, the client can be easily adapted  

---

## 🧠 Architecture

                ┌────────────────────────────┐
                │        React UI            │
                │ (TruckList / Details)     │
                └─────────────┬─────────────┘
                              │
                              ▼
                ┌────────────────────────────┐
                │     Custom Hooks Layer     │
                │ (useFleetTelemetry, etc.)  │
                └─────────────┬─────────────┘
                              │ dispatch
                              ▼
                ┌────────────────────────────┐
                │        Redux Store         │
                │  (fleet, connection)      │
                └─────────────┬─────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌──────────────────────┐               ┌────────────────────────┐
│      REST Layer      │               │   Realtime Layer       │
│  (httpClient + API)  │               │  (SSE / WebSocket)     │
└─────────────┬────────┘               └─────────────┬──────────┘
              │                                      │
              ▼                                      ▼
     ┌───────────────────┐                ┌────────────────────┐
     │   Mock Server     │                │   Event Streams     │
     │  (Node.js)        │                │ (Telemetry / WS)    │
     └───────────────────┘                └────────────────────┘

---

## 🔄 Data Flow

### Initial Load (REST)

dispatch(fetchFleet)  
→ pending  
→ API call  
→ fulfilled  
→ Redux store updated  
→ UI renders  

---

### Live Telemetry (SSE)

SSE event  
→ dispatch(upsertTelemetryUpdate)  
→ reducer updates state  
→ UI updates in real-time  

---

### WebSocket Events

WS message  
→ dispatch(action)  
→ Redux update  
→ UI reacts  

---

## 🧩 Core Concepts

### Redux Toolkit

- Centralized state management  
- Async handled via createAsyncThunk  
- Normalized state structure (byId, allIds)  

---

### Separation of Concerns

- UI → rendering only  
- Hooks → lifecycle & connections  
- Redux → state management  
- API Layer → server communication  
- Domain → data transformation  

---

### DTO → Domain Mapping

Server DTO → Normalizer → Internal Model  

Benefits:
- Decouples UI from backend  
- Enables validation and transformation  
- Keeps business logic clean  

---

## 🔌 Realtime Strategy

- REST → initial load & mutations  
- SSE → live telemetry stream  
- WebSocket → real-time events  

---

## 🛠️ Running the Project

### Start Server

cd server  
npm install  
npm start  

Server runs on:  
http://localhost:3000  

---

### Start Client

cd client  
npm install  
npm run dev  

Client runs on:  
http://localhost:5173  

---

## ✅ Implemented

- Fleet loading via REST  
- Real-time telemetry updates (SSE)  
- Redux normalized state  
- Connection state tracking  
- DTO → domain mapping  
- Temporary mock server  

---

## 🔧 Future Improvements

- Conflict resolution UI (optimistic locking)  
- Retry & resilience strategies  
- Performance optimizations (throttling / batching)  
- Full WebSocket collaboration flow  
- Form validation & error boundaries  

---

## 💡 Summary

The system is built with a clear architecture, real-time data handling, and scalable state management.

It demonstrates a production-ready approach to building real-time applications with clean separation between UI, state, and transport layers.
