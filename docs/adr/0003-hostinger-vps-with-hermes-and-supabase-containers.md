# Hostinger VPS runs Hermes and Supabase containers for MVP

The MVP deployment baseline is a Hostinger VPS running Hermes in a Docker container and Supabase in a separate container. This keeps the initial deployment simple and matches the infrastructure already available, while avoiding per-user Hermes containers until there is a clear isolation or scaling need. Anchor still treats per-user data isolation as an application and database authorization requirement, not as a per-user container boundary.
