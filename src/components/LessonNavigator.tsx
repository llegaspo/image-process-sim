'use client'

import { useEffect, useMemo, useRef } from 'react'
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { LESSONS, type Lesson } from '@/lib/lessons'
import type { TechniqueId } from '@/lib/imageProcessing'

interface LessonNavigatorProps {
  currentLesson: Lesson
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: TechniqueId) => void
}

const LESSON_COUNT = String(LESSONS.length).padStart(2, '0')

export function LessonNavigator({ currentLesson, open, onOpenChange, onSelect }: LessonNavigatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const browseButtonRef = useRef<HTMLButtonElement>(null)
  const activeLessonButtonRef = useRef<HTMLButtonElement>(null)
  const currentIndex = LESSONS.findIndex((item) => item.id === currentLesson.id)
  const previousLesson = LESSONS[currentIndex - 1]
  const nextLesson = LESSONS[currentIndex + 1]
  const lessonGroups = useMemo(() => {
    const categories = Array.from(new Set(LESSONS.map((item) => item.category)))
    return categories.map((category) => ({
      category,
      lessons: LESSONS.filter((item) => item.category === category),
    }))
  }, [])

  useEffect(() => {
    if (!open) return

    activeLessonButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      onOpenChange(false)
      browseButtonRef.current?.focus()
    }
    const closeOutside = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return
      if (event.target instanceof Element && event.target.closest('[aria-controls="lesson-curriculum"]')) return
      onOpenChange(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOutside)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOutside)
    }
  }, [onOpenChange, open])

  return (
    <div className={`lesson-navigator ${open ? 'open' : ''}`} id="lesson-navigation" ref={containerRef}>
      <nav className="lesson-switcher" aria-label="Lesson navigation">
        <div className="lesson-step-controls">
          <button
            aria-label={previousLesson ? `Previous lesson: ${previousLesson.title}` : 'No previous lesson'}
            disabled={!previousLesson}
            onClick={() => previousLesson && onSelect(previousLesson.id)}
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            aria-label={nextLesson ? `Next lesson: ${nextLesson.title}` : 'No next lesson'}
            disabled={!nextLesson}
            onClick={() => nextLesson && onSelect(nextLesson.id)}
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="lesson-summary" aria-live="polite">
          <span>{currentLesson.number} / {LESSON_COUNT}</span>
          <strong>{currentLesson.title}</strong>
          <i aria-hidden="true" />
          <small>{currentLesson.category}</small>
        </div>

        <button
          className="browse-lessons"
          type="button"
          ref={browseButtonRef}
          aria-expanded={open}
          aria-controls="lesson-curriculum"
          onClick={() => onOpenChange(!open)}
        >
          <BookOpen aria-hidden="true" size={15} />
          <span>Browse all lessons</span>
          <ChevronDown aria-hidden="true" className="browse-chevron" size={16} />
        </button>
      </nav>

      <div className="lesson-menu-panel" id="lesson-curriculum" role="region" aria-label="All image processing lessons" hidden={!open}>
        <div className="lesson-panel-head">
          <div><span>LESSON INDEX</span><b>Choose a lesson</b></div>
          <button type="button" aria-label="Close lesson index" onClick={() => { onOpenChange(false); browseButtonRef.current?.focus() }}><X aria-hidden="true" size={20} /></button>
        </div>

        <div className="lesson-progress" aria-hidden="true">
          {lessonGroups.map(({ category }) => (
            <div className={currentLesson.category === category ? 'active' : ''} key={category}>
              <span>{category}</span><i />
            </div>
          ))}
        </div>

        <div className="lesson-columns">
          {lessonGroups.map(({ category, lessons }) => {
            const headingId = `lesson-category-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`
            return (
              <section aria-labelledby={headingId} key={category}>
                <h2 id={headingId}>{category}</h2>
                <div className="lesson-column-list">
                  {lessons.map((item) => (
                    <button
                      className={currentLesson.id === item.id ? 'active' : ''}
                      type="button"
                      ref={currentLesson.id === item.id ? activeLessonButtonRef : undefined}
                      aria-current={currentLesson.id === item.id ? 'step' : undefined}
                      onClick={() => onSelect(item.id)}
                      key={item.id}
                    >
                      <span>{item.number}</span><b>{item.title}</b>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {open && <button className="lesson-menu-backdrop" type="button" aria-label="Close lesson index" onClick={() => onOpenChange(false)} />}
    </div>
  )
}
