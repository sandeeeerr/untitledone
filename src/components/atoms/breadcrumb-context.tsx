'use client'

import React, { createContext, useContext } from 'react'

type BreadcrumbOverride = {
	currentPageLabel?: string
}

const BreadcrumbContext = createContext<BreadcrumbOverride>({})

export function useBreadcrumbOverride() {
	return useContext(BreadcrumbContext)
}

export function BreadcrumbProvider({ value, children }: { value: BreadcrumbOverride; children: React.ReactNode }) {
	return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}


