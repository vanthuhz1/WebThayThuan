import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h1>404</h1>
      <p>Page Not Found</p>
      <Link to="/">Go Home</Link>
    </div>
  )
}

export default NotFound

