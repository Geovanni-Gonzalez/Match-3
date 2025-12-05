import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

// Mock the useAuth hook
jest.mock('./context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: null,
        login: jest.fn(),
        logout: jest.fn(),
        socket: null,
        apiUrl: 'http://localhost:4000',
        isDetectingBackend: false
    })
}));

test('renders welcome screen by default', () => {
    render(
        <MemoryRouter>
            <App />
        </MemoryRouter>
    );
    const titleElement = screen.getByText(/Match-3/i);
    expect(titleElement).toBeInTheDocument();
});
