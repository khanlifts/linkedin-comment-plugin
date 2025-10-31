import { useState } from "react"
import ListCard from "./list-card"
import ListSelector from "./list-selector"

const FeedBuilder = () => {
  const [isCreating, setIsCreating] = useState(false)
  const [listName, setListName] = useState("")

  const handleCreateClick = () => {
    if (listName.trim().length === 0) return
    setListName("")
    setIsCreating(false)
  }

  const handleCancelClick = () => {
    setListName("")
    setIsCreating(false)
  }

  return (
    <div className="feed-builder">
      <div className="feed-builder__header">FeedBuilder</div>
      <div className="feed-builder__add-to-list-section">
        <button className="feed-builder__create-lists-button">
          + Add to list
        </button>
        <ListSelector/>
      </div>
      <div className="feed-builder__create-section">
        {!isCreating ? (
          <button
            className="feed-builder__create-lists-button"
            onClick={() => setIsCreating(true)}
          >
            + Create new list
          </button>
        ) : (
          <div className="feed-builder__create-list-section">
            <div className="feed-builder__create-list-section-input">
              <input
                className="feed-builder__create-list-input"
                type="text"
                placeholder="Enter list name..."
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>
            <div className="feed-builder__create-list-section-action">
              <button
                className="feed-builder__create-list-button"
                disabled={listName.trim().length === 0}
                onClick={handleCreateClick}
              >
                Create
              </button>
              <button
                className="feed-builder__create-list-cancel"
                onClick={handleCancelClick}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="feed-builder__list">
        <ListCard/>
      </div>
    </div>
  )
}

export default FeedBuilder