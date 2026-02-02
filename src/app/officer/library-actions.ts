'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates a library folder (name, parent_id).
 */
export async function updateLibraryFolder(folderId: string, name: string, parentId?: string | null) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('library_folders')
            .update({ name, parent_id: parentId })
            .eq('id', folderId)

        if (error) throw error

        revalidatePath('/officer/library')
        revalidatePath('/atco/library')
        return { success: true }
    } catch (error: any) {
        console.error('Update Folder Error:', error)
        return { error: error.message || 'Failed to update folder' }
    }
}

/**
 * Deletes a library folder.
 * Note: Cascade should handle contents if FKs are set to CASCADE.
 */
export async function deleteLibraryFolder(folderId: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('library_folders')
            .delete()
            .eq('id', folderId)

        if (error) throw error

        revalidatePath('/officer/library')
        revalidatePath('/atco/library')
        return { success: true }
    } catch (error: any) {
        console.error('Delete Folder Error:', error)
        return { error: error.message || 'Failed to delete folder' }
    }
}

/**
 * Moves a course to a different folder.
 */
export async function moveCourseToFolder(courseId: string, folderId: string | null) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('courses')
            .update({ folder_id: folderId })
            .eq('id', courseId)

        if (error) throw error

        revalidatePath('/officer/library')
        revalidatePath('/atco/library')
        return { success: true }
    } catch (error: any) {
        console.error('Move Course Error:', error)
        return { error: error.message || 'Failed to move course' }
    }
}

/**
 * Updates course metadata for library items.
 */
export async function updateCourseLibraryMetadata(courseId: string, data: {
    title?: string
    description?: string
    category?: string
    difficulty_level?: string
    estimated_duration?: number
    resource_type?: string
    tags?: string[]
    is_library_item?: boolean
}) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('courses')
            .update(data)
            .eq('id', courseId)

        if (error) throw error

        revalidatePath('/officer/library')
        revalidatePath('/atco/library')
        revalidatePath(`/atco/classroom/${courseId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Update Course Metadata Error:', error)
        return { error: error.message || 'Failed to update metadata' }
    }
}
