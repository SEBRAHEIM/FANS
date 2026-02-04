import { Suspense } from 'react'
import CourseCatalogWrapper, { CourseCatalogSkeleton } from '../components/CourseCatalogWrapper'
import CatalogHeader from '../components/CatalogHeader'

export default async function ContentPage() {
    return (
        <div className="p-6 xl:p-12 pt-24 xl:pt-10">
            <CatalogHeader />
            <Suspense fallback={<CourseCatalogSkeleton />}>
                <CourseCatalogWrapper />
            </Suspense>
        </div>
    )
}
