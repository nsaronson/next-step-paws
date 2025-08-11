import React, { useState, useEffect } from 'react';
import './LessonNotes.css';
import { LessonNote, User } from '../types/auth';

interface LessonNotesProps {
  user: User;
}

const LessonNotes: React.FC<LessonNotesProps> = ({ user }) => {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'private' | 'group'>('all');
  const [selectedDog, setSelectedDog] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const [newNote, setNewNote] = useState({
    dogName: '',
    ownerEmail: '',
    lessonType: 'private' as 'private' | 'group',
    notes: '',
    progress: '',
    homework: '',
    nextSteps: '',
    behaviorObservations: '',
    classId: '',
    bookingId: ''
  });

  useEffect(() => {
    const savedNotes = localStorage.getItem('lessonNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const saveNotes = (updatedNotes: LessonNote[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('lessonNotes', JSON.stringify(updatedNotes));
  };

  const handleAddNote = () => {
    if (!newNote.dogName || !newNote.ownerEmail || !newNote.notes) {
      alert('Please fill in required fields: Dog Name, Owner Email, and Notes');
      return;
    }

    const note: LessonNote = {
      id: Date.now().toString(),
      ...newNote,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedNotes = [...notes, note];
    saveNotes(updatedNotes);
    
    setNewNote({
      dogName: '',
      ownerEmail: '',
      lessonType: 'private',
      notes: '',
      progress: '',
      homework: '',
      nextSteps: '',
      behaviorObservations: '',
      classId: '',
      bookingId: ''
    });
    setIsAddingNote(false);
    alert('Lesson note added successfully! 🐩📝');
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this lesson note?')) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      saveNotes(updatedNotes);
    }
  };

  const getFilteredNotes = () => {
    return notes.filter(note => {
      const matchesSearch = 
        note.dogName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.behaviorObservations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.homework?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || note.lessonType === filterType;
      const matchesDog = !selectedDog || note.dogName === selectedDog;
      
      return matchesSearch && matchesType && matchesDog;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getUniqueDogs = () => {
    const dogSet = new Set(notes.map(note => note.dogName));
    const dogs = Array.from(dogSet);
    return dogs.sort();
  };



  if (user.role !== 'owner') {
    return (
      <div className="lesson-notes">
        <div className="card">
          <h2>🚫 Access Denied</h2>
          <p>Only business owners can access lesson notes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-notes">
      <div className="card">
        <div className="notes-header">
          <h2>📝 Lesson Notes & Progress Tracking</h2>
          <button 
            className="btn add-note-btn"
            onClick={() => setIsAddingNote(true)}
          >
            ➕ Add New Note
          </button>
        </div>

        <div className="filters-section">
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search notes, dogs, or owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'private' | 'group')}
              className="filter-select"
            >
              <option value="all">All Lessons</option>
              <option value="private">Private Lessons</option>
              <option value="group">Group Classes</option>
            </select>
            
            <select
              value={selectedDog}
              onChange={(e) => setSelectedDog(e.target.value)}
              className="filter-select"
            >
              <option value="">All Dogs</option>
              {getUniqueDogs().map(dog => (
                <option key={dog} value={dog}>{dog}</option>
              ))}
            </select>
          </div>
        </div>

        {isAddingNote && (
          <div className="add-note-form">
            <h3>Add New Lesson Note</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Dog Name *</label>
                <input
                  type="text"
                  value={newNote.dogName}
                  onChange={(e) => setNewNote({...newNote, dogName: e.target.value})}
                  placeholder="Enter dog's name"
                />
              </div>
              
              <div className="form-group">
                <label>Owner Email *</label>
                <input
                  type="email"
                  value={newNote.ownerEmail}
                  onChange={(e) => setNewNote({...newNote, ownerEmail: e.target.value})}
                  placeholder="owner@example.com"
                />
              </div>
              
              <div className="form-group">
                <label>Lesson Type *</label>
                <select
                  value={newNote.lessonType}
                  onChange={(e) => setNewNote({...newNote, lessonType: e.target.value as 'private' | 'group'})}
                >
                  <option value="private">Private Lesson</option>
                  <option value="group">Group Class</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <label>Lesson Notes *</label>
                <textarea
                  value={newNote.notes}
                  onChange={(e) => setNewNote({...newNote, notes: e.target.value})}
                  placeholder="What happened during this lesson?"
                  rows={3}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Progress & Achievements</label>
                <textarea
                  value={newNote.progress}
                  onChange={(e) => setNewNote({...newNote, progress: e.target.value})}
                  placeholder="Progress made, commands learned, improvements..."
                  rows={2}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Behavior Observations</label>
                <textarea
                  value={newNote.behaviorObservations}
                  onChange={(e) => setNewNote({...newNote, behaviorObservations: e.target.value})}
                  placeholder="Behavioral notes, reactions, social interactions..."
                  rows={2}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Homework Assignment</label>
                <textarea
                  value={newNote.homework}
                  onChange={(e) => setNewNote({...newNote, homework: e.target.value})}
                  placeholder="Practice exercises for the owner to work on..."
                  rows={2}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Next Steps & Goals</label>
                <textarea
                  value={newNote.nextSteps}
                  onChange={(e) => setNewNote({...newNote, nextSteps: e.target.value})}
                  placeholder="What to focus on next time..."
                  rows={2}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button className="btn save-btn" onClick={handleAddNote}>
                💾 Save Note
              </button>
              <button 
                className="btn cancel-btn" 
                onClick={() => setIsAddingNote(false)}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        <div className="notes-stats">
          <div className="stat-card">
            <h4>📊 Total Notes</h4>
            <div className="stat-number">{notes.length}</div>
          </div>
          <div className="stat-card">
            <h4>🐕 Dogs Tracked</h4>
            <div className="stat-number">{getUniqueDogs().length}</div>
          </div>
          <div className="stat-card">
            <h4>🏠 Private Lessons</h4>
            <div className="stat-number">{notes.filter(n => n.lessonType === 'private').length}</div>
          </div>
          <div className="stat-card">
            <h4>👥 Group Classes</h4>
            <div className="stat-number">{notes.filter(n => n.lessonType === 'group').length}</div>
          </div>
        </div>

        <div className="notes-list">
          {getFilteredNotes().length === 0 ? (
            <div className="no-notes">
              <p>📭 No lesson notes found matching your criteria.</p>
              <p>Add some notes to start tracking progress!</p>
            </div>
          ) : (
            getFilteredNotes().map(note => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <div className="note-title">
                    <h3>🐩 {note.dogName}</h3>
                    <span className={`lesson-type ${note.lessonType}`}>
                      {note.lessonType === 'private' ? '🏠 Private' : '👥 Group'}
                    </span>
                  </div>
                  <div className="note-meta">
                    <span className="note-date">{new Date(note.date).toLocaleDateString()}</span>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="note-details">
                  <p><strong>Owner:</strong> {note.ownerEmail}</p>
                  
                  <div className="note-section">
                    <h4>📝 Lesson Notes</h4>
                    <p>{note.notes}</p>
                  </div>
                  
                  {note.progress && (
                    <div className="note-section">
                      <h4>🎯 Progress & Achievements</h4>
                      <p>{note.progress}</p>
                    </div>
                  )}
                  
                  {note.behaviorObservations && (
                    <div className="note-section">
                      <h4>👀 Behavior Observations</h4>
                      <p>{note.behaviorObservations}</p>
                    </div>
                  )}
                  
                  {note.homework && (
                    <div className="note-section">
                      <h4>📚 Homework Assignment</h4>
                      <p>{note.homework}</p>
                    </div>
                  )}
                  
                  {note.nextSteps && (
                    <div className="note-section">
                      <h4>🎯 Next Steps</h4>
                      <p>{note.nextSteps}</p>
                    </div>
                  )}
                </div>
                
                <div className="note-footer">
                  <small>Created: {new Date(note.createdAt).toLocaleString()}</small>
                  {note.updatedAt !== note.createdAt && (
                    <small>Updated: {new Date(note.updatedAt).toLocaleString()}</small>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonNotes;
