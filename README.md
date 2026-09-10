# MyResolveCenter

MyResolveCenter helps people identify unexpected subscription and digital-purchase charges, assess their evidence, and follow the appropriate company-specific refund process without connecting a bank account.

## MVP foundation

- Interactive free charge-assessment entry point
- Responsive marketing and pricing experience
- Supabase PostgreSQL schema
- Row-Level Security for user-owned cases
- Private evidence and generated-document buckets
- Versioned company playbooks and country guidance
- PayPal-ready payment records

## Local setup

Install dependencies and start the application using the scripts in `package.json`. Copy `.env.example` to `.env.local` when Supabase and payment credentials are available.

The database installation instructions are in `supabase/README.md`.
