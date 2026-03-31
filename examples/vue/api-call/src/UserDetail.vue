<script setup lang="ts">
import { usePulse } from '@pulse/vue'
import {
  userDetails,
  isLoadingDetails,
  selectedUserId,
  type UserDetails,
  UserDetailsChanged,
  IsLoadingDetailsChanged,
  SelectedUserIdChanged,
} from './engine'

const details = usePulse(UserDetailsChanged, userDetails)
const loading = usePulse(IsLoadingDetailsChanged, isLoadingDetails)
const selected = usePulse(SelectedUserIdChanged, selectedUserId)

const colors = {
  primary: '#4361ee',
  primaryLight: '#eef0ff',
  text: '#1a1a2e',
  muted: '#6c757d',
  border: '#e9ecef',
}
</script>

<template>
  <template v-if="selected">
    <div v-if="loading" :style="{
      marginTop: '24px',
      padding: '24px',
      background: '#ffffff',
      borderRadius: '12px',
      border: `2px solid ${colors.border}`,
    }">
      <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: colors.muted }">
        Loading user details...
      </div>
    </div>
    <div v-else-if="details" :style="{
      marginTop: '24px',
      padding: '24px',
      background: '#ffffff',
      borderRadius: '12px',
      border: `2px solid ${colors.border}`,
    }">
      <div :style="{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }">
        <div :style="{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: colors.primary,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '22px',
          flexShrink: 0,
        }">{{ details.avatar }}</div>
        <div>
          <h3 :style="{ margin: 0, fontSize: '22px', color: colors.text }">{{ details.name }}</h3>
          <p :style="{ margin: '4px 0 0', color: colors.muted, fontSize: '14px' }">{{ details.email }}</p>
        </div>
      </div>
      <div :style="{ marginBottom: '12px' }">
        <div :style="{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: colors.muted, letterSpacing: '0.5px' }">Role</div>
        <div :style="{ fontSize: '15px', color: colors.text, marginTop: '2px' }">{{ details.role }}</div>
      </div>
      <div :style="{ marginBottom: '12px' }">
        <div :style="{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: colors.muted, letterSpacing: '0.5px' }">Bio</div>
        <div :style="{ fontSize: '15px', color: colors.text, marginTop: '2px' }">{{ details.bio }}</div>
      </div>
      <div :style="{ marginBottom: '12px' }">
        <div :style="{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: colors.muted, letterSpacing: '0.5px' }">Location</div>
        <div :style="{ fontSize: '15px', color: colors.text, marginTop: '2px' }">{{ details.location }}</div>
      </div>
      <div :style="{ marginBottom: '12px' }">
        <div :style="{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: colors.muted, letterSpacing: '0.5px' }">Joined</div>
        <div :style="{ fontSize: '15px', color: colors.text, marginTop: '2px' }">{{ details.joinDate }}</div>
      </div>
      <div :style="{ marginBottom: '12px' }">
        <div :style="{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: colors.muted, letterSpacing: '0.5px' }">Projects</div>
        <div>
          <span
            v-for="p in details.projects"
            :key="p"
            :style="{
              display: 'inline-block',
              padding: '4px 10px',
              background: colors.primaryLight,
              color: colors.primary,
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              marginRight: '6px',
              marginTop: '4px',
            }"
          >{{ p }}</span>
        </div>
      </div>
    </div>
  </template>
</template>
