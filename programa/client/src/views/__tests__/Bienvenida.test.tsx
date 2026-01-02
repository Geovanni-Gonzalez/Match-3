import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { Bienvenida } from '../Bienvenida';
import { AuthContext } from '../../context/AuthContext';

// Mock de axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock del contexto de autenticación
const mockLogin = jest.fn();
const mockAuthContextValue = {
    currentUser: null,
    login: mockLogin,
    logout: jest.fn(),
    socket: null,
    apiUrl: 'http://localhost:3000',
    isDetectingBackend: false,
    isAuthenticated: false,
};

jest.mock('../../context/AuthContext', () => ({
    useAuth: () => mockAuthContextValue,
    AuthContext: {
        Provider: ({ children }: { children: React.ReactNode }) => children
    }
}));

describe('Bienvenida Component', () => {
    const renderWithAuth = () => {
        return render(
            <AuthContext.Provider value={mockAuthContextValue}>
                <Bienvenida />
            </AuthContext.Provider>
        );
    };

    it('renders welcome title and input', () => {
        renderWithAuth();
        expect(screen.getByText(/Match-3/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Tu nombre de jugador legendario/i)).toBeInTheDocument();
    });

    it('validates nickname length', () => {
        renderWithAuth();
        const input = screen.getByPlaceholderText(/Tu nombre de jugador legendario/i);
        const button = screen.getByRole('button', { name: /¡EMPEZAR AVENTURA!/i });

        // Input too short
        fireEvent.change(input, { target: { value: 'ab' } });
        expect(button).toBeDisabled();

        // Input valid
        fireEvent.change(input, { target: { value: 'abc' } });
        expect(button).not.toBeDisabled();
    });

    it('calls login on button click', async () => {
        // Mock axios.post to return a successful response
        mockedAxios.post.mockResolvedValueOnce({
            data: { jugadorId: 123 }
        });

        renderWithAuth();
        const input = screen.getByPlaceholderText(/Tu nombre de jugador legendario/i);
        const button = screen.getByText(/¡EMPEZAR AVENTURA!/i);

        fireEvent.change(input, { target: { value: 'Player1' } });
        fireEvent.click(button);

        // Verify axios was called with correct parameters
        await screen.findByText(/Match-3/i); // Wait for component to settle
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:3000/api/jugador/registrar',
            { nickname: 'Player1' },
            { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        expect(mockLogin).toHaveBeenCalledWith('Player1', 123);
    });
});
