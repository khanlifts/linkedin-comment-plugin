<template>
  <div class="engage-feed-lists">
    <!-- Header with title and create button -->
    <div class="header">
      <h3>My Lists</h3>
      <n-button 
        type="primary" 
        size="small" 
        @click="showCreateModal = true"
      >
        + Create List
      </n-button>
    </div>

    <!-- Lists container with max height and scroll -->
    <div class="lists-container">
      <!-- No lists placeholder -->
      <div v-if="lists.length === 0" class="empty-state">
        <n-empty description="No lists yet." />
      </div>

      <!-- Lists display -->
      <div v-else class="lists">
        <div 
          v-for="list in lists" 
          :key="list.id"
          class="list-item"
          :class="{ active: selectedList?.id === list.id }"
          @click="selectList(list)"
        >
          <div class="list-info">
            <div class="list-name">{{ list.name }}</div>
            <div class="list-count">{{ list.profiles.length }} profiles</div>
          </div>
          
          <!-- 3-dot dropdown menu -->
          <n-dropdown
            :options="getDropdownOptions(list)"
            @select="handleDropdownAction($event, list)"
            trigger="click"
          >
            <n-button 
              quaternary 
              circle 
              size="small"
              @click.stop
            >
              <n-icon>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </n-icon>
            </n-button>
          </n-dropdown>
        </div>
      </div>

      <!-- Selected list profiles -->
      <div v-if="selectedList" class="profiles-section">
        <div class="profiles-header">
          <h4>{{ selectedList.name }} ({{ selectedList.profiles.length }})</h4>
          <n-button 
            size="small" 
            @click="selectedList = null"
          >
            Back
          </n-button>
        </div>
        
        <div class="profiles-list">
          <div 
            v-for="profile in selectedList.profiles" 
            :key="profile.id"
            class="profile-item"
          >
            <div class="profile-info">
              <div class="profile-name">{{ profile.name }}</div>
              <div class="profile-title">{{ profile.title }}</div>
            </div>
            <n-button 
              size="small" 
              type="error" 
              quaternary
              @click="removeProfile(selectedList, profile)"
            >
              Remove
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create List Modal -->
    <n-modal v-model:show="showCreateModal">
      <n-card
        style="width: 300px"
        title="Create New List"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-form :model="newListForm" ref="formRef">
          <n-form-item label="List Name" path="name">
            <n-input 
              v-model:value="newListForm.name" 
              placeholder="Enter list name"
              @keyup.enter="createList"
            />
          </n-form-item>
        </n-form>
        
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <n-button @click="showCreateModal = false">Cancel</n-button>
            <n-button type="primary" @click="createList">Create</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>

    <!-- Rename Modal -->
    <n-modal v-model:show="showRenameModal">
      <n-card
        style="width: 300px"
        title="Rename List"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-form :model="renameForm" ref="renameFormRef">
          <n-form-item label="List Name" path="name">
            <n-input 
              v-model:value="renameForm.name" 
              placeholder="Enter new name"
              @keyup.enter="renameList"
            />
          </n-form-item>
        </n-form>
        
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <n-button @click="showRenameModal = false">Cancel</n-button>
            <n-button type="primary" @click="renameList">Rename</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  NButton, 
  NDropdown, 
  NIcon, 
  NEmpty, 
  NModal, 
  NCard, 
  NForm, 
  NFormItem, 
  NInput,
  useMessage
} from 'naive-ui'

// Message API for notifications
const message = useMessage()

// Reactive data
const lists = ref([])
const selectedList = ref(null)
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const listToRename = ref(null)

// Form data
const newListForm = ref({ name: '' })
const renameForm = ref({ name: '' })

// Form refs
const formRef = ref(null)
const renameFormRef = ref(null)

// Utility functions
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const generateFeedURL = (profileIds) => {
  const idsParam = profileIds.join(',')
  return `https://www.linkedin.com/search/results/content/?fromMember=${idsParam}&sortBy="date_posted"`
}

// Storage functions - Use chrome.storage.local as primary storage
const saveLists = () => {
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ engageFeedLists: lists.value })
  } else {
    // Fallback to localStorage if chrome.storage not available
    localStorage.setItem('engageFeedLists', JSON.stringify(lists.value))
  }
}

const loadLists = () => {
  if (chrome?.storage?.local) {
    chrome.storage.local.get(['engageFeedLists'], (result) => {
      if (result.engageFeedLists) {
        lists.value = result.engageFeedLists
      } else {
        // Migrate from localStorage if it exists
        const saved = localStorage.getItem('engageFeedLists')
        if (saved) {
          const migratedLists = JSON.parse(saved)
          lists.value = migratedLists
          // Save to chrome.storage and remove from localStorage
          chrome.storage.local.set({ engageFeedLists: migratedLists })
          localStorage.removeItem('engageFeedLists')
        }
      }
    })
  } else {
    // Fallback to localStorage if chrome.storage not available
    const saved = localStorage.getItem('engageFeedLists')
    if (saved) {
      lists.value = JSON.parse(saved)
    }
  }
}

// List management
const createList = () => {
  if (!newListForm.value.name.trim()) return
  
  const newList = {
    id: generateUUID(),
    name: newListForm.value.name.trim(),
    profiles: [],
    createdAt: new Date().toISOString()
  }
  
  lists.value.push(newList)
  saveLists()
  newListForm.value.name = ''
  showCreateModal.value = false
  message.success('List created successfully!')
}

const deleteList = (list) => {
  const index = lists.value.findIndex(l => l.id === list.id)
  if (index > -1) {
    lists.value.splice(index, 1)
    saveLists()
    if (selectedList.value?.id === list.id) {
      selectedList.value = null
    }
    message.success('List deleted successfully!')
  }
}

const renameList = () => {
  if (!renameForm.value.name.trim() || !listToRename.value) return
  
  const list = lists.value.find(l => l.id === listToRename.value.id)
  if (list) {
    list.name = renameForm.value.name.trim()
    saveLists()
    renameForm.value.name = ''
    showRenameModal.value = false
    listToRename.value = null
    message.success('List renamed successfully!')
  }
}

const openFeed = (list) => {
  if (list.profiles.length === 0) {
    message.warning('List is empty. Add profiles first.')
    return
  }
  
  const feedURL = generateFeedURL(list.profiles.map(p => p.id))
  window.open(feedURL, '_blank')
  message.success('Feed opened in new tab!')
}

const shareList = async (list) => {
  if (list.profiles.length === 0) {
    message.warning('List is empty. Add profiles first.')
    return
  }
  
  const feedURL = generateFeedURL(list.profiles.map(p => p.id))
  
  try {
    await navigator.clipboard.writeText(feedURL)
    message.success('Feed URL copied to clipboard!')
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = feedURL
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    message.success('Feed URL copied to clipboard!')
  }
}

const removeProfile = (list, profile) => {
  const index = list.profiles.findIndex(p => p.id === profile.id)
  if (index > -1) {
    list.profiles.splice(index, 1)
    saveLists()
    message.success('Profile removed from list!')
  }
}

// UI helpers
const selectList = (list) => {
  selectedList.value = list
}

const getDropdownOptions = (list) => [
  {
    label: 'Open Feed',
    key: 'open',
    disabled: list.profiles.length === 0
  },
  {
    label: 'Rename List',
    key: 'rename'
  },
  {
    label: 'Share List',
    key: 'share',
    disabled: list.profiles.length === 0
  },
  {
    type: 'divider'
  },
  {
    label: 'Delete List',
    key: 'delete',
    props: {
      style: { color: '#d03050' }
    }
  }
]

const handleDropdownAction = (key, list) => {
  switch (key) {
    case 'open':
      openFeed(list)
      break
    case 'rename':
      listToRename.value = list
      renameForm.value.name = list.name
      showRenameModal.value = true
      break
    case 'share':
      shareList(list)
      break
    case 'delete':
      deleteList(list)
      break
  }
}

// Message listener for content script communication
const handleMessage = (message) => {
  if (message.type === 'CREATE_LIST') {
    const newList = {
      id: generateUUID(),
      name: message.name,
      profiles: [],
      createdAt: new Date().toISOString()
    }
    
    lists.value.push(newList)
    saveLists()
    message.success('List created successfully!')
  }
}

// Initialize
onMounted(() => {
  loadLists()
  
  // Listen for messages from content script
  if (chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener(handleMessage)
  }
  
  // Listen for storage changes to sync between popup and content script
  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.engageFeedLists) {
        lists.value = changes.engageFeedLists.newValue || []
      }
    })
  }
})
</script>

<style scoped>
.engage-feed-lists {
  border-top: 1px solid #e0e0e6;
  padding-top: 12px;
  margin-top: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.lists-container {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: 20px;
  text-align: center;
}

.lists {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.list-item:hover {
  border-color: #18a058;
  background-color: #f6ffed;
}

.list-item.active {
  border-color: #18a058;
  background-color: #f6ffed;
}

.list-info {
  flex: 1;
}

.list-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.list-count {
  font-size: 12px;
  color: #666;
}

.profiles-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e6;
}

.profiles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.profiles-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.profiles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

.profile-title {
  font-size: 11px;
  color: #666;
  margin-top: 1px;
}

/* Scrollbar styling */
.lists-container::-webkit-scrollbar {
  width: 4px;
}

.lists-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.lists-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.lists-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
