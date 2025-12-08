const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="text-primary text-xl">
        <i className={icon}></i>
      </div>
      <div>
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  )
}

export default FeatureCard

