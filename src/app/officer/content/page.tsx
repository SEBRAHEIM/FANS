import { Suspense } from 'react'
import CourseCatalogWrapper, { CourseCatalogSkeleton } from '../components/CourseCatalogWrapper'

export default async function ContentPage() {
    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <Suspense fallback={<CourseCatalogSkeleton />}>
                <CourseCatalogWrapper />
            </Suspense>
        </div>
    )
}
