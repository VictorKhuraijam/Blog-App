import conf from '../conf/conf'
import {Editor} from '@tinymce/tinymce-react'
import {Controller} from 'react-hook-form'

export default function RTE({name, control, label, defaultValue = ""}) {
  return (
    <div className='w-full'>
      {label && <label className='inline-block mb-1 pl-1'>
                    {label}
                </label>}

      <Controller
      name={name || "content"}

      control={control}
      render={({field: {onChange}}) => (
        <Editor
        initialValue={defaultValue}
        apiKey= {conf.RTE_Api}
        init={{
            initialValue: defaultValue,
            branding: false,
            height: 500,
            menubar: true,
            plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
            ],
            toolbar:
            "undo redo | formatselect | bold italic forecolor | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | removeformat | help",
            content_style: `
                  body {
                    font-family:Helvetica,Arial,sans-serif;
                    font-size:14px;
                    text-align: left;
                  }
                  p, h1, h2, h3, h4, h5, h6 {
                    text-align: left !important;
                  }
                      h3 {
                        font-size: 1.5rem;
                        font-weight: bold;
                        margin-top: 1rem;
                        margin-bottom: 0.5rem;
                      }
                      p {
                        font-size: 1rem;
                        margin-top: 0.5rem;
                        margin-bottom: 0.5rem;
                        line-height: 1.6;
                      }
                      ul {
                        margin-left: 2rem;
                      }
                      li {
                        margin-bottom: 0.5rem;
                      }`,
             block_formats: "Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3",
             forced_root_block: 'p',
             textAlign: 'left',
        }}
        onEditorChange={onChange}
        />
      )}
      />
    </div>
  )
}
