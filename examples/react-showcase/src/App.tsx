import { useRoutes, Navigate } from 'react-router-dom'
import Layout from './Layout'
import { routes } from './routes'

export default function App() {
  const element = useRoutes([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/todo-list" replace /> },
        ...routes,
      ],
    },
  ])

  return element
}
