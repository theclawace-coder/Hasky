param(
  [Parameter(Mandatory = $true)]
  [string]$SupabaseAccessToken,

  [Parameter(Mandatory = $false)]
  [string]$ProjectRef = "qsqmwsouqgfrxwgnobeq",

  [Parameter(Mandatory = $false)]
  [string]$AppBaseUrl,

  [Parameter(Mandatory = $false)]
  [string]$ResendApiKey,

  [Parameter(Mandatory = $false)]
  [string]$ResendFromEmail,

  [Parameter(Mandatory = $false)]
  [string]$StripeSecretKey,

  [Parameter(Mandatory = $false)]
  [string]$StripePublishableKey,

  [Parameter(Mandatory = $false)]
  [string]$StripeWebhookSecret,

  [Parameter(Mandatory = $false)]
  [string]$SupabaseServiceRoleKey,

  [Parameter(Mandatory = $false)]
  [string]$SupabaseAnonKey,

  [Parameter(Mandatory = $false)]
  [string]$SupabaseUrl,

  [Parameter(Mandatory = $false)]
  [string]$PlatformAdminEmail
)

$ErrorActionPreference = "Stop"

$env:SUPABASE_ACCESS_TOKEN = $SupabaseAccessToken

Write-Host "Using project ref: $ProjectRef"

# Apply migrations
npx supabase db push --project-ref $ProjectRef

# Deploy auth-required functions (default verify_jwt=true)
$jwtFunctions = @(
  "invite-team-member",
  "promote-platform-admin"
)

foreach ($fn in $jwtFunctions) {
  Write-Host "Deploying $fn (verify_jwt=true)"
  npx supabase functions deploy $fn --project-ref $ProjectRef
}

# Deploy public/webhook functions (verify_jwt=false; these handle auth internally or are public)
$publicFunctions = @(
  "create-payment-intent",
  "get-public-document",
  "stripe-webhook",
  "notify-new-user",
  "get-stripe-config",
  "set-stripe-config",
  "send-document-email",
  "send-payment-reminder",
  "generate-invoice-pdf"
)

foreach ($fn in $publicFunctions) {
  Write-Host "Deploying $fn (verify_jwt=false)"
  npx supabase functions deploy $fn --project-ref $ProjectRef --no-verify-jwt
}

# Optionally set edge-function secrets in one call.
$secretPairs = @()
if ($AppBaseUrl) { $secretPairs += "APP_BASE_URL=$AppBaseUrl" }
if ($ResendApiKey) { $secretPairs += "RESEND_API_KEY=$ResendApiKey" }
if ($ResendFromEmail) { $secretPairs += "RESEND_FROM_EMAIL=$ResendFromEmail" }
if ($StripeSecretKey) { $secretPairs += "STRIPE_SECRET_KEY=$StripeSecretKey" }
if ($StripePublishableKey) { $secretPairs += "STRIPE_PUBLISHABLE_KEY=$StripePublishableKey" }
if ($StripeWebhookSecret) { $secretPairs += "STRIPE_WEBHOOK_SECRET=$StripeWebhookSecret" }
if ($SupabaseServiceRoleKey) { $secretPairs += "SUPABASE_SERVICE_ROLE_KEY=$SupabaseServiceRoleKey" }
if ($SupabaseAnonKey) { $secretPairs += "SUPABASE_ANON_KEY=$SupabaseAnonKey" }
if ($SupabaseUrl) { $secretPairs += "SUPABASE_URL=$SupabaseUrl" }
if ($PlatformAdminEmail) { $secretPairs += "PLATFORM_ADMIN_EMAIL=$PlatformAdminEmail" }

if ($secretPairs.Count -gt 0) {
  Write-Host "Setting provided secrets"
  npx supabase secrets set --project-ref $ProjectRef @secretPairs
} else {
  Write-Host "No secrets were passed to script. Skipping secrets set."
}

Write-Host "Deployment complete."
