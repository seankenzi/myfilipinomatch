/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcomeEmail } from './welcome-email.tsx'
import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as matchNotification } from './match-notification.tsx'
import { template as profileLiked } from './profile-liked.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-email': welcomeEmail,
  'contact-confirmation': contactConfirmation,
  'match-notification': matchNotification,
  'profile-liked': profileLiked,
}
