'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface GeneratedSlide {
    title: string
    elements: any[]
}

/**
 * Mocks an AI slide generation process.
 */
export async function generateSlidesAction(prompt: string) {
    console.log('🤖 AI GENERATION START:', prompt)

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Authentication required' }
        }

        const generatedSlides: GeneratedSlide[] = [
            {
                title: `Overview: ${prompt}`,
                elements: [
                    { id: crypto.randomUUID(), type: 'text', content: prompt.toUpperCase(), x: 10, y: 10, width: 80, height: 15, fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
                    { id: crypto.randomUUID(), type: 'text', content: 'Comprehensive Training Module', x: 10, y: 30, width: 80, height: 10, fontSize: 24, fontWeight: 'normal', textAlign: 'center', color: '#3b82f6' }
                ]
            },
            {
                title: 'Core Fundamentals',
                elements: [
                    { id: crypto.randomUUID(), type: 'text', content: 'Key Concepts', x: 10, y: 10, width: 30, height: 10, fontSize: 32, fontWeight: 'bold', textAlign: 'left' },
                    { id: crypto.randomUUID(), type: 'text', content: '• Understanding the logic\n• Standard operating procedures\n• Communication protocols\n• Safety measures', x: 10, y: 25, width: 80, height: 50, fontSize: 24, fontWeight: 'normal', textAlign: 'left' }
                ]
            },
            {
                title: 'Operational Workflow',
                elements: [
                    { id: crypto.randomUUID(), type: 'text', content: 'Process Diagram', x: 10, y: 10, width: 40, height: 10, fontSize: 32, fontWeight: 'bold', textAlign: 'left' },
                    { id: crypto.randomUUID(), type: 'shape', content: 'Rectangle', x: 20, y: 30, width: 60, height: 40, color: '#1e293b' },
                    { id: crypto.randomUUID(), type: 'text', content: 'PHASE 1: Assessment\nPHASE 2: Execution\nPHASE 3: Review', x: 25, y: 35, width: 50, height: 30, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
                ]
            },
            {
                title: 'Advanced Scenarios',
                elements: [
                    { id: crypto.randomUUID(), type: 'text', content: 'Edge Cases', x: 10, y: 10, width: 40, height: 10, fontSize: 32, fontWeight: 'bold', textAlign: 'left' },
                    { id: crypto.randomUUID(), type: 'text', content: 'Managing unexpected variables and ensuring high-performance outcomes under pressure.', x: 10, y: 25, width: 80, height: 20, fontSize: 22, fontWeight: 'normal', textAlign: 'left' }
                ]
            },
            {
                title: 'Summary & Conclusion',
                elements: [
                    { id: crypto.randomUUID(), type: 'text', content: 'Review and Q&A', x: 10, y: 40, width: 80, height: 20, fontSize: 42, fontWeight: 'bold', textAlign: 'center' }
                ]
            }
        ]

        const { data: course, error: courseError } = await supabase
            .from('courses')
            .insert([{
                title: `${prompt} (AI Generated)`,
                description: `Automatically generated training slides for: ${prompt}`,
                type: 'course',
                is_library_item: false,
                created_by: user.id
            }])
            .select()
            .single()

        if (courseError) throw courseError

        const { data: module, error: moduleError } = await supabase
            .from('course_modules')
            .insert([{
                course_id: course.id,
                title: 'Training Presentation',
                module_type: 'slides',
                order_index: 1
            }])
            .select()
            .single()

        if (moduleError) throw moduleError

        const slideInserts = generatedSlides.map((s, idx) => ({
            module_id: module.id,
            title: s.title,
            content_json: { elements: s.elements },
            order_index: idx
        }))

        const { error: slidesError } = await supabase
            .from('module_slides')
            .insert(slideInserts)

        if (slidesError) throw slidesError

        revalidatePath('/officer/content')

        return {
            success: true,
            courseId: course.id,
            moduleId: module.id,
            moduleTitle: module.title
        }

    } catch (error: any) {
        console.error('AI GENERATION ERROR:', error)
        return { error: error.message || 'AI generation failed' }
    }
}
