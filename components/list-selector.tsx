import ChevronIcon from "react:~/assets/icons/chevron.svg";


const ListSelector = () => {
  return (
    <div className="list-selector">
      <div className="list-selector__list">
        <span className="list-selector__list-name">List 1</span>
        <span className="list-selector__count-section">
          <span className="list-selector__count">17</span>
          <ChevronIcon className="list-selector__count-icon"/>
        </span>
      </div>
      <div className="list-selector__list">
        <span className="list-selector__list-name">List 2</span>
        <span className="list-selector__count-section">
          <span className="list-selector__count">9</span>
          <ChevronIcon className="list-selector__count-icon"/>
        </span>
      </div>
    </div>
  )
}

export default ListSelector