const FeedBuilder = () => {
  return (
    <div className="feed-builder">
      <div className="feed-builder__header">FeedBuilder</div>
      <div className="feed-builder__body">
        <div className="feed-builder__create-list-section">
          <input className="feed-builder__create-list-input"
                 type="text"
                 placeholder="Enter list name..."
          />
          <button className="feed-builder__create-list-button">Create</button>
          <button className="feed-builder__create-list-cancel">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default FeedBuilder