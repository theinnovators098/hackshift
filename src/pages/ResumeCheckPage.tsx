import PageHead from '../components/PageHead'
import ResumeCheck from '../millisa/ResumeCheck'

export default function ResumeCheckPage() {
  return (
    <>
      <PageHead
        title="Resume check"
        intro="Upload your resume. Millisa reads it, tells you which roles on HackShift fit, what to fix, and what to learn next."
      />
      <div className="wrap">
        <ResumeCheck />
      </div>
    </>
  )
}
