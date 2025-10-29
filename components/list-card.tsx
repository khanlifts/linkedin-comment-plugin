import ChevronIcon from "react:~/assets/icons/chevron.svg";
import WandIcon from "react:~/assets/icons/wand.svg";
import ListCardList from "./list-card-list"

const ListCard = () => {
  return (
    <div className="list-card">
      <div className="list-card__container">
        <section className="list-card__labels">
          <ChevronIcon className="list-card__icon"/>
          <label className="list-card__list-label">Friends</label>
        </section>
        <section className="list-card__actions">
          <WandIcon className="list-card__icon"/>
        </section>
      </div>
      <ListCardList/>
    </div>
  )
}

export default ListCard