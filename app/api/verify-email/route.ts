import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email;

    if (!email) {
      return NextResponse.json(
        { valid: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid email format' },
        { status: 200 }
      );
    }

    // List of disposable domains
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      '10minutemail.com',
      'mailinator.com',
      'trashmail.com',
      'temp-mail.org',
      'fakeinbox.com',
      'yopmail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      return NextResponse.json(
        { valid: false, error: 'Disposable email addresses are not allowed' },
        { status: 200 }
      );
    }

    // Additional validation: Check for suspicious patterns
    const domainParts = domain.split('.');
    const domainName = domainParts[0];

    // Block very short domains (less than 3 characters)
    if (domainName.length < 3) {
      return NextResponse.json(
        { valid: false, error: 'Please use a valid email from a recognized provider' },
        { status: 200 }
      );
    }

    // Whitelist trusted email providers
    const trustedDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
      'zoho.com', 'yandex.com', 'gmx.com', 'live.com', 'msn.com',
      'yahoo.co.uk', 'yahoo.co.in', 'outlook.co.uk', 'googlemail.com'
    ];

    const isCommonProvider = trustedDomains.includes(domain);

    // If not a common provider and no API key, require trusted provider
    if (!isCommonProvider && !process.env.ABSTRACT_API_KEY) {
      return NextResponse.json(
        { valid: false, error: 'Please use an email from Gmail, Yahoo, Outlook, or other recognized providers' },
        { status: 200 }
      );
    }

    // Abstract API email verification
    const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY;

    if (ABSTRACT_API_KEY && isCommonProvider) {
      try {
        console.log('Verifying email with AbstractAPI:', email);
        const validationUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(
          email
        )}`;
        const response = await fetch(validationUrl);

        if (!response.ok) {
          console.error('AbstractAPI returned non-OK status:', response.status);
          const errorText = await response.text();
          console.error('AbstractAPI error response:', errorText);
          // If API fails, block signup to be safe
          return NextResponse.json(
            { valid: false, error: 'Unable to verify email. Please try again later.' },
            { status: 200 }
          );
        }

        const data = await response.json();
        console.log('AbstractAPI response:', JSON.stringify(data));

        // Check deliverability - STRICT CHECK
        if (data.deliverability === 'UNDELIVERABLE' || data.deliverability === 'RISKY') {
          return NextResponse.json(
            { valid: false, error: 'This email address does not exist or cannot receive emails' },
            { status: 200 }
          );
        }

        // Check if it's a disposable email
        if (data.is_disposable_email?.value === true) {
          return NextResponse.json(
            { valid: false, error: 'Disposable email addresses are not allowed' },
            { status: 200 }
          );
        }

        // Check format validity
        if (data.is_valid_format?.value === false) {
          return NextResponse.json(
            { valid: false, error: 'Invalid email format' },
            { status: 200 }
          );
        }

        // Check if email is risky or has quality issues
        if (data.quality_score !== undefined && data.quality_score < 0.7) {
          return NextResponse.json(
            { valid: false, error: 'This email address appears to be invalid or risky' },
            { status: 200 }
          );
        }

        // Check SMTP validity - CRITICAL CHECK
        if (data.is_smtp_valid?.value === false) {
          return NextResponse.json(
            { valid: false, error: 'This email address cannot receive emails' },
            { status: 200 }
          );
        }

        // If we got here, email passed all checks
        console.log('Email validation passed for:', email);
        return NextResponse.json({ valid: true }, { status: 200 });
      } catch (err) {
        console.error('Abstract API error:', err);
        // If API fails, block signup to be safe
        return NextResponse.json(
          { valid: false, error: 'Unable to verify email. Please try again later.' },
          { status: 200 }
        );
      }
    }

    // If no API key but common provider, allow it
    if (isCommonProvider) {
      return NextResponse.json({ valid: true }, { status: 200 });
    }

    // Should not reach here due to earlier checks
    return NextResponse.json(
      { valid: false, error: 'Please use an email from a recognized provider' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
