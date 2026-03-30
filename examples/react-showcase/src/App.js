import { jsx as _jsx } from "react/jsx-runtime";
import { useRoutes, Navigate } from 'react-router-dom';
import Layout from './Layout';
import { routes } from './routes';
export default function App() {
    const element = useRoutes([
        {
            path: '/',
            element: _jsx(Layout, {}),
            children: [
                { index: true, element: _jsx(Navigate, { to: "/todo-list", replace: true }) },
                ...routes,
            ],
        },
    ]);
    return element;
}
