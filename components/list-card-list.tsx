import DeleteIcon from "react:~/assets/icons/delete.svg";
import PersonIcon from "react:~/assets/icons/person.svg";

const ListCardList = () => {
  return (
    <div className="list-card-list">
      <div className="list-card-list__container">
        <section className="list-card-list__labels">
          <PersonIcon className="list-card-list__icon list-card-list__icon-person"/>
          <label className="list-card-list__list-label">Mr. Bogus</label>
        </section>
        <section className="list-card-list__actions">
          <DeleteIcon className="list-card-list__icon"/>
        </section>
      </div>
    </div>
  )
}

export default ListCardList