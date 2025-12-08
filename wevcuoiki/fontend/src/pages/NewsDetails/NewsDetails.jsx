import { useParams } from 'react-router-dom'

const NewsDetails = () => {
  const { id } = useParams()
  return <div>News Details Page - News ID: {id}</div>
}

export default NewsDetails

