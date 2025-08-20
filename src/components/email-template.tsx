import * as React from 'react'

export type EmailTemplateProps = {
	headline: string
	body: string
	ctaLabel?: string
	ctaUrl?: string
}

export function EmailTemplate({ headline, body, ctaLabel, ctaUrl }: EmailTemplateProps) {
	return (
		<div style={{ fontFamily: 'Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif', lineHeight: 1.6, color: '#111827' }}>
			<h1 style={{ fontSize: 20, margin: '0 0 16px' }}>{headline}</h1>
			<p style={{ margin: '0 0 16px' }}>{body}</p>
			{ctaUrl && (
				<p style={{ margin: '24px 0 0' }}>
					<a
						href={ctaUrl}
						style={{
							display: 'inline-block',
							background: '#111827',
							color: '#ffffff',
							padding: '10px 14px',
							borderRadius: 6,
							textDecoration: 'none',
						}}
						target="_blank"
						rel="noreferrer"
					>
						{ctaLabel ?? 'Open'}
					</a>
				</p>
			)}
			<p style={{ marginTop: 24, fontSize: 12, color: '#6b7280' }}>
				If the button doesn’t work, copy and paste this link in your browser:<br />
				<em>{ctaUrl}</em>
			</p>
		</div>
	)
}


