module.exports = {
  title: 'HGK ACT Submission Form',
  schema: {
    '$id': 'https://mediathek.hgk.fhnw.ch/act.schema.json', // Path to defined Schemo or api response
    '$schema': 'http://json-schema.org/draft-07/schema#',
    title: 'ACT',
    description: 'Schema template example for <a href="https://ba14ns21403.fhnw.ch/mediaserver/app/upload/act.php">this From</a>',
    type: 'object',
    properties: {
      type: {
        type: 'string',
        const: 'act-template'
      },
      title: {
        'type': 'string',
        'title': 'Performance Title',
        'x-itemClass': 'md7 xs12'
      },
      rico: {
        type: 'object',
        properties: {
          impact: {
            type: 'object',
            properties: {
              output: {
                type: 'object',
                $ref: '#/definitions/impactOutputEntity'
              }
            }
          }
        }
      },
      event: {
        type: 'array',
        title: null,
        format: 'group',
        items: {
          $ref: '#/definitions/eventEntity'
        }
      },
      persons: {
        type: 'array',
        title: 'Persons',
        format: 'multiple',
        description: 'A list of vegetables as editable objects.',
        items: [{ '$ref': '#/definitions/personEntity' }]
      },
      work: {
        type: 'object',
        title: 'About the Work',
        format: 'expansion',
        allOf: [
          { $ref: '#/definitions/performanceEntity' },
          { $ref: '#/definitions/mediaEntity' }
        ]
      }
    },
    definitions: {
      eventEntity: {
        title: 'Event Details',
        description: 'Lorem ipsum ...',
        type: 'object',
        format: 'inline',
        properties: {
          organiser: {
            type: 'string',
            title: 'Organizer',
            'x-icon': 'account_balance',
            'x-itemClass': 'xs12 md7'
          },
          year: {
            'x-itemClass': 'xs12 md5',
            title: 'Year',
            type: 'string',
            format: 'year'
          },
          location: {
            title: 'Venue',
            type: 'string',
            description: 'Where is this Event?',
            'x-itemClass': 'xs12 md7'
          }
        }
      },
      personEntity: {
        type: 'object',
        title: 'Person Details',
        format: 'inline',
        required: [ 'lastName', 'email', 'role' ],
        properties: {
          'firstName': {
            'type': 'string',
            'x-itemClass': 'xs12 md6'
          },
          'lastName': {
            'type': 'string',
            'x-itemClass': 'xs12 md6'
          },
          'email': {
            'type': 'string',
            'x-itemClass': 'xs12 md6'
          },
          'email2': {
            'type': 'string',
            'x-itemClass': 'xs12 md6'
          },
          role: {
            title: 'Role',
            type: 'string',
            'x-itemClass': 'xs12 md6',
            description: 'Select the Role of the Person',
            oneOf: [
              {
                const: 'artist',
                title: 'Artist'
              },
              {
                const: 'involved',
                title: 'Performer Involved'
              },
              {
                const: 'docu',
                title: 'Documentalist'
              },
              {
                const: 'feedback',
                title: 'Feedback'
              },
              {
                const: 'mentor',
                title: 'Feedback'
              },
              {
                const: 'group_mentor',
                title: 'Group Mentor'
              }
            ]
          },
          website: {
            'type': 'string',
            'x-itemClass': 'xs12 md6'
          }
        }
      },
      performanceEntity: {
        title: 'Work',
        format: 'inline',
        description: 'Details and meta data about this Work.',
        properties: {
          description: {
            title: 'Idea/Description',
            type: 'string',
            maxLength: 2000
          },
          tags: {
            type: 'array',
            description: 'This is a simple array of strings',
            items: {
              type: 'string'
            }
          },
          duration: {
            type: 'string',
            description: 'This is a simple array of strings',
            'x-itemClass': 'xs12'
          },
          space: {
            title: 'Space',
            description: 'setting/stage design/public sphere/agile etc.',
            type: 'string',
            maxLength: 2000,
            'x-itemClass': 'xs12'
          },
          technics: {
            title: 'Technics (what you bring / what you need)',
            description: 'i will bring / i need',
            type: 'string',
            maxLength: 2000,
            'x-itemClass': 'xs12'
          },
          university: {
            title: 'University',
            description: 'i will bring / i need',
            type: 'string',
            maxLength: 300,
            'x-itemClass': 'xs12 md6'
          },
          institute: {
            title: 'Institute',
            description: 'i will bring / i need',
            type: 'string',
            maxLength: 300,
            'x-itemClass': 'xs12 md6'
          }
        },
        'dependencies': {
          'credit_card': {
            'properties': {
              'billing_address': { 'type': 'string' }
            },
            'required': ['billing_address']
          }
        }
      },
      mediaEntity: {
        type: 'object',
        title: 'Images and Media',
        description: 'Upload images and edit media properties. <br /> Define a prefilling Template and adjust Meta Data after upload.',
        format: 'inline',
        properties: {
          template: {
            type: 'array',
            items: [
              { $ref: '#/definitions/imageEntity' }
            ]
          },
          upload: {
            type: 'object',
            format: 'upload',
            properties: {
              meta: {
                type: 'array',
                items: [
                  { $ref: '#/definitions/imageEntity' }
                ]
              }
            }
          }
        }
      },
      imageEntity: {
        type: 'object',
        format: 'inline',
        required: ['license', 'access'],
        title: 'Image Meta Data',
        properties: {
          owner: {
            title: 'Rightholder',
            type: 'string'
          },
          license: {
            title: 'License',
            type: 'string'
          },
          reference: {
            title: 'Web Reference',
            type: 'string',
            placeholder: 'https:// ...'
          },
          embargo_start: {
            title: 'Embargo Start',
            type: 'string',
            format: 'date',
            'x-itemClass': 'xs12 md6'
          },
          embargo_end: {
            title: 'Embargo End',
            type: 'string',
            format: 'date',
            'x-itemClass': 'xs12 md6'
          },
          access: {
            title: 'Access',
            type: 'string',
            description: 'Select the access',
            oneOf: [
              {
                const: 'public',
                title: 'Internet'
              },
              {
                const: 'internal',
                title: 'FHNW'
              },
              {
                const: 'resricted',
                title: 'Restricted'
              }
            ]
          },
          legend: {
            title: 'Legend Reference',
            type: 'string'
          }
          // upload: {
          //   type: 'array',
          //   items: {
          //     type: 'object',
          //     enum: []
          //   }
          // }
        }
      },
      impactOutputEntity: {
        description: 'Lorem ipsum ...',
        type: 'object',
        'x-format': 'triangle',
        title: 'Output / Aktivität',
        properties: {
          study: {
            title: 'Lehre',
            type: 'number',
            minimum: 0,
            'x-itemClass': 'xs4'
          },
          lab: {
            title: 'Lab',
            type: 'number',
            minimum: 0,
            'x-itemClass': 'xs4'
          },
          research: {
            title: 'Research',
            minimum: 0,
            'x-itemClass': 'xs4'
          }
        }
      }
    }
  },
  data: {
    presentation: 'lorem ipsum',
    twitter: 'koumoul_fr',
    type: 'physicalPerson',
    firstName: 'Alban',
    lastName: 'Mouton',
    event: [{}],
    persons: [{}],
    upload: []
  }
}
