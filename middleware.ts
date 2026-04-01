import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Lock down all 3 core routes
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/tutor(.*)', '/learn(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Correct v5 syntax: await the protect method directly on the auth object
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};