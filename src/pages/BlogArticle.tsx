import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCMS } from '../context/CMSContext';
import { CalendarDays, User, ArrowLeft, Tag, Clock, Share2 } from 'lucide-react';

export default function BlogArticle() {
  const { id } = useParams<{ id: string }>();
  const { state } = useCMS();

  const blog = state.blogs.find(b => b.id === id);

  if (!blog) {
    return (
      <div className="w-full bg-vitorra-bg min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 transition-colors duration-500">
        <h1 className="text-4xl font-serif text-vitorra-text mb-3">Article Not Found</h1>
        <p className="text-vitorra-muted mb-8 max-w-md">This article may have been removed or doesn't exist.</p>
        <Link to="/news" className="px-8 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-full hover:bg-vitorra-text hover:text-vitorra-bg transition-all">
          Back to News
        </Link>
      </div>
    );
  }

  const readingTime = Math.max(1, Math.ceil(blog.content.split(/\s+/).length / 200));

  // Find related posts (same tags or just other posts)
  const related = state.blogs
    .filter(b => b.id !== blog.id && b.status === 'published')
    .slice(0, 3);

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text/80 font-sans transition-colors duration-500">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          {blog.imageUrl ? (
            <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-vitorra-bg-alt" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-vitorra-bg via-vitorra-bg/70 to-vitorra-bg/30" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pb-16 pt-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Link to="/news" className="inline-flex items-center gap-2 text-vitorra-muted hover:text-vitorra-gold transition-colors text-sm mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to News
            </Link>

            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-vitorra-bg/5 border border-vitorra-border rounded-full text-xs text-vitorra-gold uppercase tracking-widest font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-5xl font-serif leading-[1.15] mb-6 text-vitorra-text">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-vitorra-muted">
              <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {blog.date}</span>
              <span className="flex items-center gap-2"><User className="w-4 h-4" /> {blog.author}</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {readingTime} min read</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Body */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="prose prose-invert prose-lg max-w-none"
          >
            {blog.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-vitorra-text/80 text-lg leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </motion.article>

          {/* Share / Tags Bar */}
          <div className="border-t border-vitorra-border mt-12 pt-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-vitorra-muted/60">
              <Tag className="w-4 h-4" />
              {(blog.tags || []).map(t => (
                <span key={t} className="px-3 py-1 bg-vitorra-bg/5 border border-vitorra-border rounded-full text-xs">{t}</span>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-vitorra-bg/5 border border-vitorra-border rounded-full text-sm text-vitorra-muted hover:text-vitorra-text hover:border-vitorra-gold/50 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="py-16 bg-vitorra-bg-alt border-t border-vitorra-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-serif text-vitorra-text mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <Link key={r.id} to={`/news/${r.id}`} className="group bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden hover:border-vitorra-gold/30 transition-all duration-300 shadow-sm">
                  <div className="h-40 overflow-hidden bg-vitorra-bg-alt">
                    {r.imageUrl && <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500" />}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-vitorra-muted mb-2">{r.date}</p>
                    <h3 className="text-base font-serif text-vitorra-text group-hover:text-vitorra-gold transition-colors line-clamp-2">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
