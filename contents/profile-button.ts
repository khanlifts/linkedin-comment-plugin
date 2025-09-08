// Content script for adding "Add to List" button on LinkedIn profiles
// This script runs on LinkedIn profile pages and adds the custom button

// Import CSS styles
import './profile-button.css'

// Check if we're on a LinkedIn page
if (window.location.hostname.includes('linkedin.com')) {
  
  // Function to extract profile information
  const getProfileInfo = () => {
    // Try multiple selectors for name and title
    const nameElement = document.querySelector('h1.text-heading-xlarge, .pv-text-details__left-panel h1, .ph5 h1, h1[data-test-id="profile-name"], .pvs-header__title h1')
    const titleElement = document.querySelector('.text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium, .ph5 .text-body-medium, .pvs-header__headline, [data-test-id="profile-headline"]')
    const profileUrl = window.location.href
    
    // Extract LinkedIn ID from URL - try both numeric ID and username
    let profileId = null
    
    // First try to get numeric ID from the page (more reliable for feed URLs)
    const numericIdElement = document.querySelector('[data-member-id], [data-profile-id], input[name="memberId"]')
    if (numericIdElement) {
      profileId = numericIdElement.getAttribute('data-member-id') || 
                  numericIdElement.getAttribute('data-profile-id') ||
                  numericIdElement.value
    }
    
    // Fallback to URL-based extraction
    if (!profileId) {
      const profileIdMatch = profileUrl.match(/\/in\/([^\/\?]+)/)
      profileId = profileIdMatch ? profileIdMatch[1] : null
    }
    
    console.log('LinkedIn Extension: Extracted profile info:', {
      id: profileId,
      name: nameElement?.textContent?.trim() || 'Unknown',
      title: titleElement?.textContent?.trim() || '',
      url: profileUrl
    })
    
    return {
      id: profileId,
      name: nameElement?.textContent?.trim() || 'Unknown',
      title: titleElement?.textContent?.trim() || '',
      url: profileUrl
    }
  }

  // Function to create the Add to List button
  const createAddToListButton = () => {
    const buttonContainer = document.createElement('div')
    buttonContainer.id = 'linkedin-extension-add-to-list'
    buttonContainer.className = 'custom-linkedin-button-container-profile'
    buttonContainer.innerHTML = `
      <div class="relative inline-block">
        <button 
          class="custom-linkedin-button" 
          type="button"
          aria-haspopup="menu" 
          aria-expanded="false"
          data-state="closed"
        >
          <span class="button-text">+ Add to List</span>
        </button>
        <div class="dropdown-menu" style="display: none;">
          <div class="dropdown-lists">
            <!-- Lists will be populated here -->
          </div>
          <div class="dropdown-footer">
            <button class="create-new-list-btn">Create new list</button>
          </div>
        </div>
      </div>
    `
    
    return buttonContainer
  }

  // Function to load lists from storage
  const loadLists = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['engageFeedLists'], (result) => {
        resolve(result.engageFeedLists || [])
      })
    })
  }

  // Function to save lists to storage
  const saveLists = (lists) => {
    chrome.storage.local.set({ engageFeedLists: lists }, () => {
      // Notify popup about the change
      chrome.runtime.sendMessage({
        type: 'LISTS_UPDATED',
        lists: lists
      }).catch(() => {
        // Ignore errors if popup is not open
      })
    })
  }

  // Function to populate dropdown with lists
  const populateDropdown = async (dropdownLists) => {
    const lists = await loadLists()
    dropdownLists.innerHTML = ''
    
    if (lists.length === 0) {
      dropdownLists.innerHTML = '<div class="no-lists">No lists yet. Create one first.</div>'
      return
    }
    
    lists.forEach(list => {
      const listItem = document.createElement('button')
      listItem.className = 'dropdown-list-item'
      listItem.innerHTML = `
        <span class="list-name">${list.name}</span>
        <span class="list-count">${list.profiles.length}</span>
      `
      listItem.addEventListener('click', (e) => {
        e.stopPropagation()
        addProfileToList(list)
      })
      dropdownLists.appendChild(listItem)
    })
  }

  // Function to add profile to list
  const addProfileToList = async (list) => {
    const profileInfo = getProfileInfo()
    const lists = await loadLists()
    
    const listIndex = lists.findIndex(l => l.id === list.id)
    if (listIndex > -1) {
      // Check if profile already exists
      const existingProfile = lists[listIndex].profiles.find(p => p.id === profileInfo.id)
      if (!existingProfile) {
        lists[listIndex].profiles.push(profileInfo)
        saveLists(lists)
        showNotification(`Added ${profileInfo.name} to ${list.name}`)
      } else {
        showNotification(`${profileInfo.name} is already in ${list.name}`)
      }
    }
    
    // Close dropdown
    const dropdown = document.querySelector('.dropdown-menu')
    if (dropdown) {
      dropdown.style.display = 'none'
    }
  }

  // Function to show notification
  const showNotification = (message) => {
    // Create a simple notification
    const notification = document.createElement('div')
    notification.className = 'linkedin-extension-notification'
    notification.textContent = message
    document.body.appendChild(notification)
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  // Function to inject the button (only on profile pages)
  const injectButton = () => {
    // Only inject on profile pages
    if (!window.location.pathname.includes('/in/')) {
      return
    }
    // Find the profile action buttons area - try multiple selectors including the new one
    let actionButtonsArea = document.querySelector('.pvs-profile-actions__custom, .pv-top-card__actions, .ph5 .pv-top-card__actions, .pvs-header__actions')
    
    // If not found, look for the button container or the "Mehr" button's parent
    if (!actionButtonsArea) {
      const mehrButton = document.querySelector('button[aria-label="Weitere Aktionen"], button[aria-label="Mehr"], button[id*="profile-overflow-action"]')
      if (mehrButton) {
        actionButtonsArea = mehrButton.closest('.pvs-profile-actions__custom') ||
                          mehrButton.closest('.pv-top-card__actions') || 
                          mehrButton.closest('.pvs-header__actions') ||
                          mehrButton.closest('.ph5') ||
                          mehrButton.parentElement
      }
    }
    
    // Alternative: look for any container with both "Nachricht" and "Mehr" buttons
    if (!actionButtonsArea) {
      const nachrichtButton = document.querySelector('button[aria-label*="Nachricht"], button[aria-label*="Message"]')
      if (nachrichtButton) {
        actionButtonsArea = nachrichtButton.closest('.pvs-profile-actions__custom') ||
                          nachrichtButton.closest('.pv-top-card__actions') || 
                          nachrichtButton.closest('.pvs-header__actions') ||
                          nachrichtButton.closest('.ph5') ||
                          nachrichtButton.parentElement
      }
    }
    
    // Additional fallback: look for the specific div with the class from the image
    if (!actionButtonsArea) {
      actionButtonsArea = document.querySelector('.LJMnFhQbkaHbZlWMTaInpCStHcMvMYk.pvs-profile-actions__custom')
    }
    
    if (actionButtonsArea && !document.getElementById('linkedin-extension-add-to-list')) {
      console.log('LinkedIn Extension: Found action buttons area:', actionButtonsArea)
      console.log('LinkedIn Extension: Action buttons area classes:', actionButtonsArea.className)
      const buttonContainer = createAddToListButton()
      actionButtonsArea.appendChild(buttonContainer)
      console.log('LinkedIn Extension: Button injected successfully')
      
      // Add event listeners
      const button = buttonContainer.querySelector('.custom-linkedin-button')
      const dropdown = buttonContainer.querySelector('.dropdown-menu')
      const dropdownLists = buttonContainer.querySelector('.dropdown-lists')
      const createNewListBtn = buttonContainer.querySelector('.create-new-list-btn')
      
      button.addEventListener('click', (e) => {
        e.stopPropagation()
        const isOpen = dropdown.style.display !== 'none'
        
        if (isOpen) {
          dropdown.style.display = 'none'
          button.setAttribute('aria-expanded', 'false')
          button.setAttribute('data-state', 'closed')
        } else {
          dropdown.style.display = 'block'
          button.setAttribute('aria-expanded', 'true')
          button.setAttribute('data-state', 'open')
          populateDropdown(dropdownLists)
        }
      })
      
      // Handle create new list button
      createNewListBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        handleCreateNewList()
      })
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!buttonContainer.contains(e.target)) {
          dropdown.style.display = 'none'
          button.setAttribute('aria-expanded', 'false')
          button.setAttribute('data-state', 'closed')
        }
      })
    } else if (!actionButtonsArea) {
      console.log('LinkedIn Extension: Could not find action buttons area')
      console.log('LinkedIn Extension: Available elements with pvs-profile-actions:', document.querySelectorAll('[class*="pvs-profile-actions"]'))
      console.log('LinkedIn Extension: Available elements with profile-actions:', document.querySelectorAll('[class*="profile-actions"]'))
      console.log('LinkedIn Extension: Available buttons:', document.querySelectorAll('button[aria-label*="Nachricht"], button[aria-label*="Message"], button[aria-label*="Mehr"]'))
    } else {
      console.log('LinkedIn Extension: Button already exists')
    }
  }

  // Function to handle create new list
  const handleCreateNewList = () => {
    const listName = prompt('Enter list name:')
    if (listName && listName.trim()) {
      // Send message to popup to create new list
      chrome.runtime.sendMessage({
        type: 'CREATE_LIST',
        name: listName.trim()
      })
    }
  }

  // Initialize when DOM is ready
  const initialize = () => {
    console.log('LinkedIn Extension: Initializing...')
    
    // Try multiple times with different delays
    setTimeout(injectButton, 500)
    setTimeout(injectButton, 1500)
    setTimeout(injectButton, 3000)
    
    // Also try when the page changes (for SPA navigation)
    const observer = new MutationObserver(() => {
      if (!document.getElementById('linkedin-extension-add-to-list')) {
        injectButton()
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
  } else {
    initialize()
  }
}
