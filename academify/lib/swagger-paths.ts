/**
 * OpenAPI path definitions for routes without inline @swagger JSDoc.
 * Parsed by swagger-jsdoc via lib/swagger.ts.
 */

/**
 * @openapi
 * /api/auth/sign-up/email:
 *   post:
 *     summary: Register with email and password (Better Auth)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       200: { description: Account created / signed in }
 *       400: { description: Validation error }
 *
 * /api/auth/sign-in/email:
 *   post:
 *     summary: Sign in with email and password (Better Auth)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Session cookie set }
 *       401: { description: Invalid credentials }
 *
 * /api/auth/sign-out:
 *   post:
 *     summary: Sign out (Better Auth)
 *     tags: [Authentication]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200: { description: Session cleared }
 *
 * /api/auth/get-session:
 *   get:
 *     summary: Get current Better Auth session
 *     tags: [Authentication]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200: { description: Session payload }
 *       401: { description: No active session }
 *
 * /api/auth/config:
 *   get:
 *     summary: Public auth config (e.g. Google OAuth enabled)
 *     tags: [Authentication]
 *     responses:
 *       200: { description: Auth configuration JSON }
 *
 * /api/auth/me:
 *   get:
 *     summary: Get current application user profile
 *     tags: [Authentication]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200: { description: User object with role }
 *       401: { description: Not authenticated }
 *
 * /api/users:
 *   get:
 *     summary: List users (search / discovery)
 *     tags: [Users]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name or username
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: User list }
 *       401: { description: Not authenticated }
 *
 * /api/users/connections:
 *   get:
 *     summary: Get following and followers for current user
 *     tags: [Users]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200: { description: Connections payload }
 *       401: { description: Not authenticated }
 *
 * /api/users/{userId}:
 *   get:
 *     summary: Get user profile by ID (use me for own profile)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Profile with counts }
 *       401: { description: Required when userId is me }
 *       404: { description: User not found }
 *   patch:
 *     summary: Update own profile (partial)
 *     tags: [Users]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               bio: { type: string }
 *               major: { type: string }
 *               skills: { type: array, items: { type: string } }
 *               showEmail: { type: boolean }
 *               dmRestriction: { type: string, enum: [ALL, CONNECTIONS, LECTURERS, NONE] }
 *     responses:
 *       200: { description: Updated profile }
 *       401: { description: Not authenticated }
 *       403: { description: Can only update own profile }
 *   put:
 *     summary: Update own profile (full)
 *     tags: [Users]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated profile }
 *       401: { description: Not authenticated }
 *       403: { description: Can only update own profile }
 *   delete:
 *     summary: Delete own account
 *     tags: [Users]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Account deleted }
 *       401: { description: Not authenticated }
 *       403: { description: Can only delete own account }
 *
 * /api/users/{userId}/posts:
 *   get:
 *     summary: Get recent posts by user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post list }
 *
 * /api/users/{userId}/events:
 *   get:
 *     summary: Get events for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [created, attending] }
 *     responses:
 *       200: { description: Event list }
 *
 * /api/users/{userId}/banner:
 *   get:
 *     summary: Serve user banner image
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Image bytes or redirect }
 *       404: { description: Banner not found }
 *
 * /api/users/{userId}/avatar:
 *   get:
 *     summary: Serve user avatar image
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Image bytes or redirect }
 *       404: { description: Avatar not found }
 *
 * /api/users/{userId}/follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Followed }
 *       401: { description: Not authenticated }
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Users]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Unfollowed }
 *       401: { description: Not authenticated }
 *
 * /api/profile/setup:
 *   post:
 *     summary: Complete onboarding profile setup
 *     tags: [Profile]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, username]
 *             properties:
 *               role: { type: string, enum: [STUDENT, LECTURER] }
 *               username: { type: string }
 *               educationLevel: { type: string }
 *               major: { type: string }
 *               bio: { type: string }
 *               skillTags: { type: array, items: { type: string } }
 *               department: { type: string }
 *     responses:
 *       200: { description: Profile setup complete }
 *       400: { description: Validation error }
 *       401: { description: Not authenticated }
 *
 * /api/search:
 *   get:
 *     summary: Global search (users, forums, threads)
 *     tags: [Search]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 10, default: 5 }
 *     responses:
 *       200: { description: Search results }
 *       401: { description: Not authenticated }
 *
 * /api/storage/upload:
 *   post:
 *     summary: Upload file to MinIO (server-side, max 50 MB)
 *     tags: [Storage]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Upload result with object key }
 *       401: { description: Not authenticated }
 *       403: { description: Restricted account }
 *
 * /api/storage/presign:
 *   post:
 *     summary: Get presigned PUT URL for client upload
 *     tags: [Storage]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, contentType]
 *             properties:
 *               fileName: { type: string }
 *               contentType: { type: string }
 *     responses:
 *       200: { description: Presigned URL and key }
 *       401: { description: Not authenticated }
 *
 * /api/storage/delete:
 *   post:
 *     summary: Delete object from MinIO by key
 *     tags: [Storage]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key]
 *             properties:
 *               key: { type: string }
 *     responses:
 *       200: { description: Object deleted }
 *       401: { description: Not authenticated }
 *
 * /api/storage/upload-avatar:
 *   post:
 *     summary: Upload profile avatar (max 2 MB)
 *     tags: [Storage]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar updated }
 *       401: { description: Not authenticated }
 *
 * /api/storage/upload-banner:
 *   post:
 *     summary: Upload profile banner (max 5 MB)
 *     tags: [Storage]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Banner updated }
 *       401: { description: Not authenticated }
 *
 * /api/storage/upload-entity-banner/{type}/{id}:
 *   post:
 *     summary: Upload banner for event, collab space, or forum
 *     tags: [Storage]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema: { type: string, enum: [event, space, forum] }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Entity banner updated }
 *       401: { description: Not authenticated }
 *       403: { description: Forbidden }
 *
 * /api/ai/health:
 *   get:
 *     summary: Check Ollama availability and model status
 *     tags: [AI]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200: { description: Health status }
 *       401: { description: Not authenticated }
 *
 * /api/ai/moderate:
 *   post:
 *     summary: AI content moderation for draft post
 *     tags: [AI]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string, maxLength: 300 }
 *               content: { type: string, maxLength: 5000 }
 *               forum: { type: string }
 *     responses:
 *       200: { description: Moderation decision }
 *       401: { description: Not authenticated }
 *       429: { description: Rate limited }
 *
 * /api/ai/recommend:
 *   get:
 *     summary: Thread recommendations for current user
 *     tags: [AI]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 8, default: 5 }
 *       - in: query
 *         name: heuristic
 *         schema: { type: string, enum: ["1"] }
 *         description: Skip AI and use heuristic fallback
 *     responses:
 *       200: { description: Ranked thread suggestions }
 *       401: { description: Not authenticated }
 *       429: { description: Rate limited }
 *
 * /api/ai/recommend/forums:
 *   get:
 *     summary: Forum recommendations for current user
 *     tags: [AI]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: query
 *         name: heuristic
 *         schema: { type: string, enum: ["1"] }
 *     responses:
 *       200: { description: Ranked forum suggestions }
 *       401: { description: Not authenticated }
 *       429: { description: Rate limited }
 *
 * /api/ai/summarize/{postId}:
 *   get:
 *     summary: AI summary of thread and top comments
 *     tags: [AI]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: refresh
 *         schema: { type: string, enum: ["1"] }
 *         description: Bypass cached summary
 *     responses:
 *       200: { description: Summary JSON }
 *       401: { description: Not authenticated }
 *       404: { description: Post not found or not visible }
 *       429: { description: Rate limited }
 *
 * /api/forums/{forumId}/membership:
 *   get:
 *     summary: Get current user membership status for forum
 *     tags: [Forums]
 *     parameters:
 *       - in: path
 *         name: forumId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Membership status }
 *   post:
 *     summary: Join a forum
 *     tags: [Forums]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: forumId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Joined }
 *       401: { description: Not authenticated }
 *   delete:
 *     summary: Leave a forum
 *     tags: [Forums]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: forumId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Left forum }
 *       401: { description: Not authenticated }
 *
 * /api/forums/{forumId}/members:
 *   get:
 *     summary: List forum members (forum admin)
 *     tags: [Forums]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: forumId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Member list }
 *       403: { description: Forum admin only }
 *   put:
 *     summary: Assign or remove forum moderator
 *     tags: [Forums]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: forumId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, isModerator]
 *             properties:
 *               userId: { type: string }
 *               isModerator: { type: boolean }
 *     responses:
 *       200: { description: Moderator updated }
 *       403: { description: Forum admin only }
 *
 * /api/posts/{postId}/like:
 *   get:
 *     summary: Get like count and whether current user liked
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Like state }
 *   post:
 *     summary: Toggle like on post
 *     tags: [Posts]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Like toggled }
 *       401: { description: Not authenticated }
 *
 * /api/comments/{commentId}/like:
 *   get:
 *     summary: Get like count and whether current user liked
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Like state }
 *   post:
 *     summary: Toggle like on comment
 *     tags: [Comments]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Like toggled }
 *       401: { description: Not authenticated }
 *
 * /api/files/scan:
 *   post:
 *     summary: ClamAV scan of MinIO object
 *     tags: [Files]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [objectKey]
 *             properties:
 *               objectKey: { type: string }
 *               fileName: { type: string }
 *     responses:
 *       200: { description: Scan result }
 *       401: { description: Not authenticated }
 *
 * /api/files/{fileId}/share:
 *   post:
 *     summary: Share owned file with another user via DM
 *     tags: [Files]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: File shared }
 *       401: { description: Not authenticated }
 *       403: { description: Owner only }
 *
 * /api/events:
 *   get:
 *     summary: List events with pagination
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema: { type: string, enum: [upcoming, past] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200: { description: Paginated event list }
 *   post:
 *     summary: Create event (creator auto-RSVPs)
 *     tags: [Events]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, location, date, forumID]
 *             properties:
 *               title: { type: string }
 *               location: { type: string }
 *               date: { type: string, format: date-time }
 *               forumID: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               duration: { type: integer }
 *               maxAttendees: { type: integer }
 *     responses:
 *       201: { description: Event created }
 *       401: { description: Not authenticated }
 *
 * /api/events/{eventId}:
 *   get:
 *     summary: Get event details
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event object }
 *       404: { description: Event not found }
 *   put:
 *     summary: Update own event
 *     tags: [Events]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               location: { type: string }
 *               maxAttendees: { type: integer }
 *               status: { type: string, enum: [scheduled, completed, cancelled] }
 *     responses:
 *       200: { description: Event updated }
 *       403: { description: Creator only }
 *   delete:
 *     summary: Delete own event
 *     tags: [Events]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event deleted }
 *       403: { description: Creator only }
 *
 * /api/events/{eventId}/rsvp:
 *   post:
 *     summary: RSVP to event
 *     tags: [Events]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: RSVP confirmed }
 *       400: { description: Already attending or full }
 *       401: { description: Not authenticated }
 *   delete:
 *     summary: Cancel event RSVP
 *     tags: [Events]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: RSVP cancelled }
 *       401: { description: Not authenticated }
 *
 * /api/events/{eventId}/attendees:
 *   get:
 *     summary: Get event attendee list
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attendee list with user details }
 *       404: { description: Event not found }
 *
 * /api/collaboration:
 *   get:
 *     summary: List collaboration spaces for current user
 *     tags: [Collaboration]
 *     security:
 *       - sessionCookieAuth: []
 *     responses:
 *       200: { description: Space list }
 *       401: { description: Not authenticated }
 *   post:
 *     summary: Create collaboration space
 *     tags: [Collaboration]
 *     security:
 *       - sessionCookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, forumID]
 *             properties:
 *               name: { type: string }
 *               forumID: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Space created }
 *       401: { description: Not authenticated }
 *
 * /api/collaboration/{spaceId}:
 *   get:
 *     summary: Get collaboration space details
 *     tags: [Collaboration]
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Space with membership flag }
 *       404: { description: Space not found }
 *   post:
 *     summary: Join collaboration space
 *     tags: [Collaboration]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Joined }
 *       401: { description: Not authenticated }
 *   delete:
 *     summary: Delete collaboration space (owner only)
 *     tags: [Collaboration]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Space deleted }
 *       403: { description: Owner only }
 *
 * /api/messages/space/{spaceId}:
 *   get:
 *     summary: List messages in collaboration space
 *     tags: [Messages]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: since
 *         schema: { type: string, format: date-time }
 *         description: Incremental fetch since timestamp
 *     responses:
 *       200: { description: Message list }
 *       401: { description: Not authenticated }
 *   post:
 *     summary: Send message in collaboration space
 *     tags: [Messages]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201: { description: Message sent }
 *       401: { description: Not authenticated }
 *
 * /api/moderation/revert/{postId}:
 *   post:
 *     summary: Revert approved post to flagged or blocked
 *     tags: [Moderation]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [target]
 *             properties:
 *               target: { type: string, enum: [flagged, blocked] }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Post reverted }
 *       403: { description: Moderator or admin only }
 */

export {};
